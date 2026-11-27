import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../index";
import { roundMoney } from "../pricing";
import {
  confirmOrderPayment,
  MAX_POS_ATTEMPTS,
  ordersCollection,
  sendToPos,
  type OrderDocument,
} from "./orders";

// The shop's back office: every order across branches, and the two fixes staff need most —
// re-checking a payment with Paystack, and re-sending a paid order to the branch's POS.

/** The order list's status tabs. "pos_failed" means paid, but the POS never got it. */
const statusFilter = z.enum(["all", "paid", "pending_payment", "payment_failed", "pos_failed"]);
export type AdminStatusFilter = z.infer<typeof statusFilter>;

const listInput = z.object({
  search: z.string().trim().max(120).optional(),
  status: statusFilter.default("all"),
  branchId: z.string().max(80).optional(),
  /** "YYYY-MM-DD", inclusive, in UTC (Ghana's time zone). */
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

/** A query on the orders collection. */
type OrderFilter = NonNullable<Parameters<ReturnType<typeof ordersCollection>["find"]>[0]>;

const POS_NOT_SENT: OrderFilter = { status: "paid", "smartsale.status": { $ne: "sent" } };

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Everything but the status tab, so the tab counts follow the other filters. */
function baseFilter(input: z.infer<typeof listInput>): OrderFilter {
  const filter: OrderFilter = {};
  if (input.branchId) filter["branch.id"] = input.branchId;
  if (input.from || input.to) {
    filter.createdAt = {
      ...(input.from && { $gte: new Date(`${input.from}T00:00:00Z`) }),
      ...(input.to && { $lt: new Date(new Date(`${input.to}T00:00:00Z`).getTime() + 86_400_000) }),
    };
  }
  if (input.search) {
    const re = new RegExp(escapeRegex(input.search), "i");
    // Phone numbers are typed with and without spaces, so match their digits too.
    const digits = input.search.replace(/\D/g, "");
    filter.$or = [
      { reference: re },
      { "customer.fullName": re },
      { "customer.email": re },
      { "customer.phone": re },
      ...(digits.length >= 4 ? [{ "customer.phone": new RegExp(digits.split("").join("\\D*")) }] : []),
    ];
  }
  return filter;
}

function withStatus(filter: OrderFilter, status: AdminStatusFilter): OrderFilter {
  if (status === "all") return filter;
  if (status === "pos_failed") return { $and: [filter, POS_NOT_SENT] };
  return { $and: [filter, { status }] };
}

/** Plain JSON for the browser: no ObjectId, dates as ISO strings. */
function toAdminOrder({ _id, ...order }: OrderDocument & { _id?: unknown }) {
  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    smartsale: {
      ...order.smartsale,
      claimedAt: order.smartsale.claimedAt?.toISOString() ?? null,
      sentAt: order.smartsale.sentAt?.toISOString() ?? null,
    },
  };
}
export type AdminOrder = ReturnType<typeof toAdminOrder>;

async function findOrder(orders: ReturnType<typeof ordersCollection>, reference: string) {
  const order = await orders.findOne({ reference });
  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: `No order ${reference}.` });
  return order;
}

const DAY_MS = 86_400_000;

/** One day's orders (Ghana runs on UTC all year, so a UTC day is the shop's day). */
function dayFilter(date: string, branchId?: string): OrderFilter {
  const start = new Date(`${date}T00:00:00Z`);
  return {
    createdAt: { $gte: start, $lt: new Date(start.getTime() + DAY_MS) },
    ...(branchId && { "branch.id": branchId }),
  };
}

function previousDay(date: string) {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() - DAY_MS).toISOString().slice(0, 10);
}

/** The end-of-day report: what was sold, how it was paid, and what still needs a hand. */
export async function dailySummary(orders: ReturnType<typeof ordersCollection>, date: string, branchId?: string) {
  const [day, before, allBranches] = await Promise.all([
    orders.find(dayFilter(date, branchId)).sort({ createdAt: 1 }).limit(10_000).toArray(),
    orders.find({ $and: [dayFilter(previousDay(date), branchId), { status: "paid" }] }).project<{ total: number }>({ total: 1 }).toArray(),
    orders.distinct("branch"),
  ]);
  const paid = day.filter((o) => o.status === "paid");
  const sum = (list: OrderDocument[], pick: (o: OrderDocument) => number) => roundMoney(list.reduce((n, o) => n + pick(o), 0));

  const items = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of paid) {
    for (const line of order.items) {
      const entry = items.get(line.name) ?? { name: line.name, quantity: 0, revenue: 0 };
      entry.quantity += line.quantity;
      entry.revenue = roundMoney(entry.revenue + line.lineTotal);
      items.set(line.name, entry);
    }
  }

  const channels = new Map<string, { channel: string; orders: number; total: number }>();
  for (const order of paid) {
    const channel = order.payment?.channel ?? "unknown";
    const entry = channels.get(channel) ?? { channel, orders: 0, total: 0 };
    entry.orders += 1;
    entry.total = roundMoney(entry.total + order.total);
    channels.set(channel, entry);
  }

  const branches = new Map<string, { id: string; name: string; orders: number; total: number }>();
  for (const order of paid) {
    const entry = branches.get(order.branch.id) ?? { id: order.branch.id, name: order.branch.name, orders: 0, total: 0 };
    entry.orders += 1;
    entry.total = roundMoney(entry.total + order.total);
    branches.set(order.branch.id, entry);
  }

  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0, total: 0 }));
  for (const order of paid) {
    const slot = hours[order.createdAt.getUTCHours()]!;
    slot.orders += 1;
    slot.total = roundMoney(slot.total + order.total);
  }

  const byMethod = (method: "delivery" | "pickup") => {
    const list = paid.filter((o) => o.fulfilment.method === method);
    return { orders: list.length, total: sum(list, (o) => o.total) };
  };

  const revenue = sum(paid, (o) => o.total);
  return {
    date,
    branchOptions: (allBranches as OrderDocument["branch"][])
      .filter((b) => b?.id)
      .filter((b, i, all) => all.findIndex((x) => x.id === b.id) === i)
      .map((b) => ({ id: b.id, name: b.name })),
    revenue,
    previousRevenue: roundMoney(before.reduce((n, o) => n + o.total, 0)),
    paidOrders: paid.length,
    averageOrder: paid.length ? roundMoney(revenue / paid.length) : 0,
    itemsSold: paid.reduce((n, o) => n + o.items.reduce((q, i) => q + i.quantity, 0), 0),
    breakdown: {
      subtotal: sum(paid, (o) => o.subtotal),
      delivery: sum(paid, (o) => o.deliveryFee),
      platform: sum(paid, (o) => o.platformFee ?? 0),
      discounts: sum(paid, (o) => o.discount?.amount ?? 0),
    },
    delivery: byMethod("delivery"),
    pickup: byMethod("pickup"),
    counts: {
      placed: day.length,
      paid: paid.length,
      awaitingPayment: day.filter((o) => o.status === "pending_payment").length,
      failed: day.filter((o) => o.status === "payment_failed").length,
      inPos: paid.filter((o) => o.smartsale.status === "sent").length,
      notInPos: paid.filter((o) => o.smartsale.status !== "sent").length,
    },
    topItems: [...items.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue),
    channels: [...channels.values()].sort((a, b) => b.total - a.total),
    branches: [...branches.values()].sort((a, b) => b.total - a.total),
    hours,
    /** Paid orders the branch may not have: worth a look before closing up. */
    needsAttention: day
      .filter((o) => (o.status === "paid" && o.smartsale.status !== "sent") || o.status === "pending_payment")
      .map((o) => ({
        reference: o.reference,
        customer: o.customer.fullName,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
        problem: o.status === "paid" ? ("not_in_pos" as const) : ("awaiting_payment" as const),
      })),
  };
}
export type DailySummary = Awaited<ReturnType<typeof dailySummary>>;

export const adminRouter = router({
  /** Who's signed in, for the admin header. Also proves the caller is an admin. */
  me: adminProcedure.query(({ ctx }) => ({ name: ctx.session.user.name, email: ctx.session.user.email })),

  /** The end-of-day report for one day, for every branch or one. */
  summary: adminProcedure
    .input(z.object({ date: z.iso.date(), branchId: z.string().max(80).optional() }))
    .query(({ ctx, input }) => dailySummary(ordersCollection(ctx.db), input.date, input.branchId)),

  orders: router({
    list: adminProcedure
      .input(
        listInput.extend({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(10).max(100).default(25),
        })
      )
      .query(async ({ ctx, input }) => {
        const orders = ordersCollection(ctx.db);
        const base = baseFilter(input);
        const filter = withStatus(base, input.status);

        const [rows, total, counts, branches] = await Promise.all([
          orders
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((input.page - 1) * input.pageSize)
            .limit(input.pageSize)
            .toArray(),
          orders.countDocuments(filter),
          Promise.all(
            (["all", "paid", "pending_payment", "payment_failed", "pos_failed"] as const).map(
              async (s) => [s, await orders.countDocuments(withStatus(base, s))] as const
            )
          ).then((pairs) => Object.fromEntries(pairs) as Record<AdminStatusFilter, number>),
          orders.distinct("branch"),
        ]);

        // Money taken in the current view: paid orders only.
        const [revenue] = await orders
          .aggregate<{ total: number }>([{ $match: { $and: [base, { status: "paid" }] } }, { $group: { _id: null, total: { $sum: "$total" } } }])
          .toArray();

        return {
          orders: rows.map(toAdminOrder),
          total,
          page: input.page,
          pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
          counts,
          paidTotal: revenue?.total ?? 0,
          branches: (branches as OrderDocument["branch"][])
            .filter((b) => b?.id)
            .filter((b, i, all) => all.findIndex((x) => x.id === b.id) === i)
            .map((b) => ({ id: b.id, name: b.name })),
          posSending: ctx.smartsale.submitOrders,
        };
      }),

    /** Every order matching the filters (up to 5,000), for a CSV download. */
    export: adminProcedure.input(listInput).query(async ({ ctx, input }) => {
      const rows = await ordersCollection(ctx.db)
        .find(withStatus(baseFilter(input), input.status))
        .sort({ createdAt: -1 })
        .limit(5_000)
        .toArray();
      return rows.map(toAdminOrder);
    }),

    get: adminProcedure.input(z.object({ reference: z.string().min(1) })).query(async ({ ctx, input }) => {
      return toAdminOrder(await findOrder(ordersCollection(ctx.db), input.reference));
    }),

    /**
     * Asks Paystack again. Fixes orders stuck at "pending payment" when the customer paid but
     * closed the tab before coming back and the webhook never arrived.
     */
    recheckPayment: adminProcedure.input(z.object({ reference: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      if (!ctx.paystackSecretKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Paystack isn't set up (PAYSTACK_SECRET_KEY)." });
      }
      await confirmOrderPayment(ctx.db, ctx.paystackSecretKey, input.reference, ctx.smartsale);
      return toAdminOrder(await findOrder(ordersCollection(ctx.db), input.reference));
    }),

    /** Sends a paid order to its branch's POS again, after a failure or when it gave up retrying. */
    resendToPos: adminProcedure.input(z.object({ reference: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      if (!ctx.smartsale.submitOrders) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Sending orders to the POS is switched off (SMARTSALE_SUBMIT_ORDERS=false).",
        });
      }
      const orders = ordersCollection(ctx.db);
      const order = await findOrder(orders, input.reference);
      if (order.status !== "paid") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only paid orders go to the POS." });
      }
      if (order.smartsale.status === "sent") {
        throw new TRPCError({ code: "CONFLICT", message: "The POS already has this order. Sending it again would print it twice." });
      }
      // A manual resend gets a fresh set of tries.
      if (order.smartsale.attempts >= MAX_POS_ATTEMPTS || order.smartsale.status === "failed") {
        await orders.updateOne({ reference: input.reference }, { $set: { "smartsale.attempts": 0, "smartsale.status": "failed" } });
      }
      await sendToPos(orders, ctx.smartsale, input.reference);
      return toAdminOrder(await findOrder(orders, input.reference));
    }),

    /**
     * Removes an order from the database for good (test orders, duplicates). It is not marked
     * deleted; it is gone. Nothing else changes: a payment isn't refunded on Paystack and a sale
     * already in the POS stays there. A late Paystack webhook for it is logged and ignored.
     */
    delete: adminProcedure.input(z.object({ reference: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const { deletedCount } = await ordersCollection(ctx.db).deleteOne({ reference: input.reference });
      if (deletedCount === 0) throw new TRPCError({ code: "NOT_FOUND", message: `No order ${input.reference}.` });
      console.info(`Admin: ${ctx.session.user.email} deleted order ${input.reference}`);
      return { reference: input.reference };
    }),
  }),
});

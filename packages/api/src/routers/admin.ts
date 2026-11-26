import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../index";
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

export const adminRouter = router({
  /** Who's signed in, for the admin header. Also proves the caller is an admin. */
  me: adminProcedure.query(({ ctx }) => ({ name: ctx.session.user.name, email: ctx.session.user.email })),

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
  }),
});

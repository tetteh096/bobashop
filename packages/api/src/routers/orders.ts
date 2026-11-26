import { randomBytes } from "node:crypto";

import type { Database } from "@bobashop/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { initializeTransaction, verifyTransaction } from "../paystack";
import { computeTotals, MAX_QUANTITY_PER_ITEM, roundMoney, type DiscountRule } from "../pricing";
import { lookupDiscount } from "../discount-codes";
import { SHOP } from "../data/shop";
import { quoteDelivery } from "../branch-menu";
import { rememberCustomer } from "../customers";
import {
  chosenOptions,
  describeOptions,
  normaliseOptions,
  optionsProblem,
  unitPrice,
  type ItemOptions,
} from "../data/catalog";
import { postServerRequest } from "../smartsale/client";
import { buildSale, type SaleLine } from "../smartsale/sale";
import { loadBranchMenu } from "../smartsale/storefront";
import type { SmartSaleConfig } from "../smartsale/types";

export type OrderStatus = "pending_payment" | "paid" | "payment_failed";

export type OrderDocument = {
  reference: string;
  status: OrderStatus;
  userId: string | null;
  customer: { fullName: string; email: string; phone: string };
  /** The branch that makes the order: the pickup branch, or the one delivering it. */
  branch: { id: string; name: string; phone: string };
  fulfilment:
    | {
        method: "delivery";
        address: string;
        landmark?: string;
        ghanaPostGps?: string;
        location: { lat: number; lng: number };
        /** Road kilometres from the branch, as priced. */
        distanceKm?: number;
        notes?: string;
      }
    | {
        method: "pickup";
        pickupPointId: string;
        pickupPointName: string;
        pickupPointAddress: string;
        /** Someone other than the customer, such as a driver or relative. */
        collectorName?: string;
        notes?: string;
      };
  items: {
    productId: string;
    name: string;
    options: ItemOptions;
    /** e.g. "Large (700ml)", for the order page and receipt. */
    optionsLabel: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    /** The POS item this sells and the options to quote back when the sale is posted. */
    pos: SaleLine["pos"];
    posOptions: SaleLine["posOptions"];
  }[];
  subtotal: number;
  deliveryFee: number;
  /** The platform's fee (pricing.ts PLATFORM_FEE). Included in `total`, left out of the POS sale. */
  platformFee?: number;
  discount?: { code: string; label: string; amount: number; percent?: number };
  total: number;
  currency: "GHS";
  payment?: { channel: string; paidAt: string | null; transactionId: number };
  /** The sale in the branch's POS. Posted once, after payment is confirmed. */
  smartsale: {
    storeId: string;
    status: "pending" | "sending" | "sent" | "failed";
    attempts: number;
    etaMinutes: number;
    delivery?: { byDistance: boolean; item?: { posId: string; bin: string; dept: string } };
    claimedAt?: Date;
    sentAt?: Date;
    /** Firebase's key for the request, for tracing it in SmartSale. */
    requestKey?: string | null;
    error?: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

const itemOptionsSchema = z.object({
  choices: z.record(z.string().max(60), z.string().max(80)).refine((c) => Object.keys(c).length <= 10, "Too many choices"),
});

const customerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{9,16}$/, "Enter a valid phone number"),
});

const fulfilmentSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("delivery"),
    address: z.string().trim().min(5, "Enter your delivery address").max(300),
    landmark: z.string().trim().max(200).optional(),
    ghanaPostGps: z.string().trim().max(20).optional(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    notes: z.string().trim().max(500).optional(),
  }),
  z.object({
    method: z.literal("pickup"),
    /** Ignored: pickup is always at the order's branch. Kept so older clients still work. */
    pickupPointId: z.string().optional(),
    collectorName: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
]);

export function ordersCollection(db: Database | null) {
  if (!db) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Online ordering isn't switched on yet. Please call the branch to order.`,
    });
  }
  return db.collection<OrderDocument>("orders");
}

function newReference() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function requireSecretKey(key: string | undefined) {
  if (!key) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Online payment isn't set up yet. Please call the branch to order.`,
    });
  }
  return key;
}

/**
 * Marks an order paid once Paystack confirms the full amount, then sends it to the branch's
 * POS. Safe to call repeatedly: the browser and Paystack's webhook both do.
 */
export async function confirmOrderPayment(
  db: Database | null,
  secretKey: string,
  reference: string,
  smartsale: SmartSaleConfig
) {
  const orders = ordersCollection(db);
  const order = await orders.findOne({ reference });
  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
  }
  if (order.status === "paid") {
    await sendToPos(orders, smartsale, reference);
    return order;
  }

  const tx = await verifyTransaction(secretKey, reference);
  const expectedAmount = Math.round(order.total * 100);
  const paid = tx.status === "success" && tx.amount === expectedAmount && tx.currency === "GHS";

  const update: Partial<OrderDocument> = paid
    ? {
        status: "paid",
        payment: { channel: tx.channel, paidAt: tx.paid_at, transactionId: tx.id },
        updatedAt: new Date(),
      }
    : tx.status === "failed" || tx.status === "abandoned"
      ? { status: "payment_failed", updatedAt: new Date() }
      : { updatedAt: new Date() };

  await orders.updateOne({ reference }, { $set: update });
  if (update.status === "paid") await sendToPos(orders, smartsale, reference);
  return { ...order, ...update };
}

/** Give up on the POS after this many tries; the shop can still see the order in the database. */
export const MAX_POS_ATTEMPTS = 5;
/** A send that hasn't finished in this long (the server died mid-way) may be tried again. */
const STUCK_SEND_MS = 2 * 60_000;

/**
 * Posts a paid order to its branch's POS as a sale, once. The order is claimed first, so the
 * browser's verify and Paystack's webhook arriving together can't both post it. Failures are
 * recorded and retried the next time payment is confirmed; they never fail the customer's order.
 */
export async function sendToPos(orders: ReturnType<typeof ordersCollection>, config: SmartSaleConfig, reference: string) {
  if (!config.submitOrders) return;
  const order = await orders.findOneAndUpdate(
    {
      reference,
      status: "paid",
      "smartsale.storeId": { $nin: ["", null] },
      "smartsale.attempts": { $lt: MAX_POS_ATTEMPTS },
      $or: [
        { "smartsale.status": { $in: ["pending", "failed"] } },
        { "smartsale.status": "sending", "smartsale.claimedAt": { $lt: new Date(Date.now() - STUCK_SEND_MS) } },
      ],
    },
    { $set: { "smartsale.status": "sending", "smartsale.claimedAt": new Date() }, $inc: { "smartsale.attempts": 1 } },
    { returnDocument: "after" }
  );
  if (!order) return;

  const f = order.fulfilment;
  const sale = buildSale({
    reference: order.reference,
    customer: order.customer,
    method: f.method,
    ...(f.method === "delivery"
      ? {
          address: [f.address, f.landmark && `Landmark: ${f.landmark}`, f.ghanaPostGps && `GPS: ${f.ghanaPostGps}`].filter(Boolean).join(", "),
          location: f.location,
          notes: f.notes,
        }
      : { notes: [f.collectorName && `Collected by ${f.collectorName}`, f.notes].filter(Boolean).join(". ") || undefined }),
    lines: order.items,
    ...(f.method === "delivery" && order.smartsale.delivery && { delivery: { fee: order.deliveryFee, ...order.smartsale.delivery } }),
    subtotal: order.subtotal,
    discount: order.discount,
    // What the shop received: the platform fee is the site's, not the branch's.
    total: roundMoney(order.total - (order.platformFee ?? 0)),
    channel: order.payment?.channel,
    etaMinutes: order.smartsale.etaMinutes,
  });

  try {
    const requestKey = await postServerRequest(config, order.smartsale.storeId, sale);
    await orders.updateOne(
      { reference },
      { $set: { "smartsale.status": "sent", "smartsale.sentAt": new Date(), "smartsale.requestKey": requestKey }, $unset: { "smartsale.error": "" } }
    );
  } catch (error) {
    console.error(`SmartSale: couldn't post order ${reference}`, error);
    await orders.updateOne(
      { reference },
      { $set: { "smartsale.status": "failed", "smartsale.error": error instanceof Error ? error.message.slice(0, 300) : String(error) } }
    );
  }
}

function toPublicOrder(order: OrderDocument) {
  return {
    reference: order.reference,
    status: order.status,
    customer: order.customer,
    branch: order.branch,
    fulfilment: order.fulfilment,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    platformFee: order.platformFee ?? 0,
    discount: order.discount ?? null,
    total: order.total,
    currency: order.currency,
    paidAt: order.payment?.paidAt ?? null,
    channel: order.payment?.channel ?? null,
  };
}

export const ordersRouter = router({
  /** Prices the cart from the catalogue, saves a pending order and opens a Paystack transaction. */
  create: publicProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              productId: z.string().max(120),
              options: itemOptionsSchema,
              quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
            })
          )
          .min(1, "Your bag is empty"),
        customer: customerSchema,
        /** The branch chosen in the branch picker: it makes, and delivers or hands over, the order. */
        branchId: z.string(),
        fulfilment: fulfilmentSchema,
        discountCode: z.string().trim().max(40).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const secretKey = requireSecretKey(ctx.paystackSecretKey);

      // Read the POS afresh: what's for sale, at what price, and whether the tills are open.
      const store = await loadBranchMenu(ctx.smartsale, input.branchId, 5_000).catch((error) => {
        console.error("SmartSale: couldn't load branch for an order", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We couldn't reach the shop just now. Please try again in a minute." });
      });
      if (!store) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a branch to order from" });
      }
      const { branch, menu } = store;
      if (!branch.orderingOpen) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: branch.closedMessage ?? `${branch.name} isn't taking online orders right now. Please try another branch.`,
        });
      }

      // The same item twice (two sizes) counts against one stock figure.
      const wanted = new Map<string, number>();
      for (const { productId, quantity } of input.items) wanted.set(productId, (wanted.get(productId) ?? 0) + quantity);

      const items = input.items.map(({ productId, options: raw, quantity }) => {
        const product = menu.products.find((p) => p.id === productId);
        const posItem = menu.pos.get(productId);
        if (!product || !posItem) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `An item in your bag isn't on ${branch.name}'s menu today` });
        }
        if (!product.inStock) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${product.name} is sold out at ${branch.name}` });
        }
        if (product.stockLeft !== undefined && wanted.get(productId)! > product.stockLeft) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${branch.name} has only ${product.stockLeft} ${product.name} left` });
        }
        const options = normaliseOptions(raw);
        const problem = optionsProblem(product, options);
        if (problem) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${product.name}: ${problem}` });
        }
        const price = unitPrice(product, options);
        return {
          productId,
          name: product.name,
          options,
          optionsLabel: describeOptions(options, product),
          unitPrice: price,
          quantity,
          lineTotal: roundMoney(price * quantity),
          pos: { posId: posItem.posId, bin: posItem.bin, dept: posItem.dept ?? "", type: posItem.type || "STOCK", name: posItem.name! },
          posOptions: chosenOptions(product, options).map(({ name, value }) => ({ name, value })),
        };
      });

      const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));

      // The code is looked up and applied here, never trusted from the browser.
      let rule: DiscountRule | null = null;
      if (input.discountCode) {
        const found = lookupDiscount(input.discountCode);
        if (!found.ok) throw new TRPCError({ code: "BAD_REQUEST", message: found.reason });
        rule = found.rule;
      }
      // Delivery is priced from this branch to the customer's pin, the same way the storefront shows it.
      let distanceFee: number | null = null;
      let distanceKm: number | undefined;
      let etaMinutes: number = SHOP.pickupMinutes;
      if (input.fulfilment.method === "delivery") {
        const quote = quoteDelivery(branch, input.fulfilment.location, SHOP.pickupMinutes);
        if (!quote.ok) throw new TRPCError({ code: "BAD_REQUEST", message: quote.message });
        distanceFee = quote.fee;
        distanceKm = quote.km;
        etaMinutes = quote.etaMinutes;
      }

      const { deliveryFee, platformFee, discount, total, discountShortfall } = computeTotals(subtotal, input.fulfilment.method, rule, distanceFee);
      if (rule && discount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            discountShortfall > 0
              ? `${rule.code} needs GH₵ ${discountShortfall.toFixed(2)} more in your cart`
              : `${rule.code} doesn't apply to this order`,
        });
      }
      if (total < 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This order total is too low to pay online" });
      }

      let fulfilment: OrderDocument["fulfilment"];
      if (input.fulfilment.method === "pickup") {
        const { collectorName, notes } = input.fulfilment;
        fulfilment = {
          method: "pickup",
          pickupPointId: branch.id,
          pickupPointName: `Bobalicious ${branch.name}`,
          pickupPointAddress: branch.address,
          collectorName: collectorName || undefined,
          notes,
        };
      } else {
        fulfilment = { ...input.fulfilment, distanceKm };
      }

      const now = new Date();
      const order: OrderDocument = {
        reference: newReference(),
        status: "pending_payment",
        userId: ctx.session?.user.id ?? null,
        customer: input.customer,
        branch: { id: branch.id, name: branch.name, phone: branch.phone },
        fulfilment,
        items,
        subtotal,
        deliveryFee,
        ...(platformFee > 0 && { platformFee }),
        ...(rule && { discount: { code: rule.code, label: rule.label, amount: discount, ...(rule.kind === "percent" && { percent: rule.value }) } }),
        total,
        currency: "GHS",
        smartsale: {
          storeId: store.storeId,
          status: "pending",
          attempts: 0,
          etaMinutes,
          ...(input.fulfilment.method === "delivery" && { delivery: { byDistance: store.delivery.byDistance, item: store.delivery.item } }),
        },
        createdAt: now,
        updatedAt: now,
      };

      await ordersCollection(ctx.db).insertOne(order);

      const tx = await initializeTransaction(secretKey, {
        email: input.customer.email,
        amount: Math.round(total * 100),
        reference: order.reference,
        metadata: {
          customer_name: input.customer.fullName,
          phone: input.customer.phone,
          fulfilment: fulfilment.method,
          branch: branch.name,
          discount_code: rule?.code ?? "",
        },
      });

      return { reference: order.reference, accessCode: tx.access_code, total };
    }),

  /** Called after the Paystack popup reports success; re-checks the payment with Paystack. */
  verify: publicProcedure
    .input(z.object({ reference: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const secretKey = requireSecretKey(ctx.paystackSecretKey);
      const order = await confirmOrderPayment(ctx.db, secretKey, input.reference, ctx.smartsale);
      // Next time, their phone number or email brings these details back at checkout.
      if (order.status === "paid") {
        const f = order.fulfilment;
        rememberCustomer({
          ...order.customer,
          method: f.method,
          branchId: order.branch?.id,
          ...(f.method === "delivery" && { address: f.address, landmark: f.landmark, ghanaPostGps: f.ghanaPostGps, location: f.location }),
        });
      }
      return toPublicOrder(order);
    }),
});

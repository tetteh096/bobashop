import { randomBytes } from "node:crypto";

import type { Database } from "@bobashop/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, router } from "../index";
import { initializeTransaction, verifyTransaction } from "../paystack";
import {
  computeTotals,
  findProduct,
  MAX_QUANTITY_PER_ITEM,
  roundMoney,
  type DiscountRule,
} from "../pricing";
import { lookupDiscount } from "../discount-codes";
import { SHOP, findBranch } from "../data/shop";
import { isAvailableAt, quoteDelivery } from "../branch-menu";
import { rememberCustomer } from "../customers";
import {
  describeOptions,
  normaliseOptions,
  optionsProblem,
  unitPrice,
  type DrinkOptions,
} from "../data/catalog";

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
    options: DrinkOptions;
    /** e.g. "Large · 50% sweet · Less ice · Brown sugar pearls", for the kitchen ticket. */
    optionsLabel: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  discount?: { code: string; label: string; amount: number };
  total: number;
  currency: "GHS";
  payment?: { channel: string; paidAt: string | null; transactionId: number };
  createdAt: Date;
  updatedAt: Date;
};

const drinkOptionsSchema = z.object({
  size: z.enum(["regular", "large"]),
  sweetness: z.enum(["0", "25", "50", "75", "100"]),
  ice: z.enum(["none", "less", "regular", "hot"]),
  toppings: z.array(z.enum(["pearls", "foam", "pudding", "lychee-jelly", "popping-strawberry", "popping-mango"])).max(10),
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

function ordersCollection(db: Database | null) {
  if (!db) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Online ordering isn't switched on yet. Please call ${SHOP.phone} to order.`,
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
      message: `Online payment isn't set up yet. Please call ${SHOP.phone} to order.`,
    });
  }
  return key;
}

/** Marks an order paid once Paystack confirms the full amount. Safe to call repeatedly. */
export async function confirmOrderPayment(
  db: Database | null,
  secretKey: string,
  reference: string
) {
  const orders = ordersCollection(db);
  const order = await orders.findOne({ reference });
  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
  }
  if (order.status === "paid") return order;

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
  return { ...order, ...update };
}

function toPublicOrder(order: OrderDocument) {
  return {
    reference: order.reference,
    status: order.status,
    customer: order.customer,
    fulfilment: order.fulfilment,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
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
              productId: z.string(),
              options: drinkOptionsSchema,
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

      const branch = findBranch(input.branchId);
      if (!branch) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a branch to order from" });
      }
      if (!branch.orderingOpen) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: branch.closedMessage ?? `${branch.name} isn't taking online orders right now. Please try another branch.`,
        });
      }

      const items = input.items.map(({ productId, options: raw, quantity }) => {
        const product = findProduct(productId);
        if (!product || !product.inStock) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: product ? `${product.name} is sold out today` : "An item in your bag is no longer on the menu",
          });
        }
        if (!isAvailableAt(product, branch)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${product.name} isn't served at ${branch.name}` });
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
      if (input.fulfilment.method === "delivery") {
        const quote = quoteDelivery(branch, input.fulfilment.location, SHOP.pickupMinutes);
        if (!quote.ok) throw new TRPCError({ code: "BAD_REQUEST", message: quote.message });
        distanceFee = quote.fee;
        distanceKm = quote.km;
      }

      const { deliveryFee, discount, total, discountShortfall } = computeTotals(subtotal, input.fulfilment.method, rule, distanceFee);
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
        ...(rule && { discount: { code: rule.code, label: rule.label, amount: discount } }),
        total,
        currency: "GHS",
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
      const order = await confirmOrderPayment(ctx.db, secretKey, input.reference);
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

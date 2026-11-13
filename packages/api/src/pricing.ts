import { findProduct, type Product } from "./data/catalog";

// Shared by the storefront (for display) and the orders router (for charging),
// so the totals a customer sees are the totals Paystack is asked to collect.
// Delivery is priced by distance from the branch (see branch-menu.ts); orders over this are free.
export const FREE_DELIVERY_THRESHOLD = 150;
export const MAX_QUANTITY_PER_ITEM = 20;

export type FulfilmentMethod = "delivery" | "pickup";

export { findProduct };
export type { Product };

/** `distanceFee` is the branch's quote for the customer's pin, or null before a pin is set. */
export function deliveryFeeFor(method: FulfilmentMethod, subtotal: number, distanceFee: number | null) {
  if (method === "pickup") return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : (distanceFee ?? 0);
}

export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

// Discounts -----------------------------------------------------------------
// The rule shape is public (the storefront shows it once a code is accepted);
// the list of codes lives server-side in discount-codes.ts.

export type DiscountKind = "percent" | "fixed" | "free_delivery";

export interface DiscountRule {
  code: string;
  /** Shown to the customer, e.g. "10% off your first order". */
  label: string;
  kind: DiscountKind;
  /** Percent for "percent", cedis for "fixed"; unused for "free_delivery". */
  value: number;
  /** The item subtotal needed before the code applies. */
  minSubtotal?: number;
  /** Cap on a percentage discount, in cedis. */
  maxDiscount?: number;
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  /** Delivery chosen but no location yet, so the fee isn't known. */
  deliveryPending: boolean;
  discount: number;
  total: number;
  /** How much more the customer needs to spend for the code to apply. */
  discountShortfall: number;
}

/** One calculation for the cart, checkout and the server that charges the order. */
export function computeTotals(
  subtotal: number,
  method: FulfilmentMethod,
  rule?: DiscountRule | null,
  distanceFee: number | null = null
): OrderTotals {
  const deliveryFee = deliveryFeeFor(method, subtotal, distanceFee);
  const deliveryPending = method === "delivery" && distanceFee === null && subtotal < FREE_DELIVERY_THRESHOLD;
  let discount = 0;
  let shortfall = 0;

  if (rule) {
    shortfall = Math.max(0, (rule.minSubtotal ?? 0) - subtotal);
    if (shortfall === 0) {
      if (rule.kind === "percent") discount = (subtotal * rule.value) / 100;
      else if (rule.kind === "fixed") discount = rule.value;
      else discount = deliveryFee;
      if (rule.maxDiscount !== undefined) discount = Math.min(discount, rule.maxDiscount);
      // Never more than the thing it discounts.
      discount = Math.min(discount, rule.kind === "free_delivery" ? deliveryFee : subtotal);
    }
  }

  discount = roundMoney(discount);
  return {
    subtotal: roundMoney(subtotal),
    deliveryFee,
    deliveryPending,
    discount,
    total: roundMoney(subtotal + deliveryFee - discount),
    discountShortfall: roundMoney(shortfall),
  };
}

export function normaliseCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

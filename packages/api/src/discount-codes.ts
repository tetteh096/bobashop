// Server-only: never import this from the storefront, or every code ships to the browser.
// Sample codes until the business sets its own; move these to the database once there's
// an admin screen to manage them.

import { normaliseCode, type DiscountRule } from "./pricing";

interface DiscountCode extends DiscountRule {
  active: boolean;
  /** ISO dates (YYYY-MM-DD); the code works from the start of startsAt to the end of endsAt. */
  startsAt?: string;
  endsAt?: string;
}

const DISCOUNT_CODES: DiscountCode[] = [
  {
    code: "PEARLFRIEND",
    label: "10% off your order",
    kind: "percent",
    value: 10,
    minSubtotal: 80,
    maxDiscount: 30,
    active: true,
  },
  {
    code: "WELCOME15",
    label: "GH₵ 15 off your first order",
    kind: "fixed",
    value: 15,
    minSubtotal: 90,
    active: true,
  },
  {
    code: "FREEDELIVERY",
    label: "Free delivery",
    kind: "free_delivery",
    value: 0,
    minSubtotal: 60,
    active: true,
  },
];

export type DiscountLookup = { ok: true; rule: DiscountRule } | { ok: false; reason: string };

export function lookupDiscount(raw: string, now = new Date()): DiscountLookup {
  const code = normaliseCode(raw);
  const found = DISCOUNT_CODES.find((d) => d.code === code);
  if (!found || !found.active) return { ok: false, reason: `“${code}” isn't a valid code` };
  if (found.startsAt && now < new Date(`${found.startsAt}T00:00:00Z`)) {
    return { ok: false, reason: `${code} isn't active yet` };
  }
  if (found.endsAt && now > new Date(`${found.endsAt}T23:59:59Z`)) {
    return { ok: false, reason: `${code} has expired` };
  }
  const { code: c, label, kind, value, minSubtotal, maxDiscount } = found;
  return { ok: true, rule: { code: c, label, kind, value, minSubtotal, maxDiscount } };
}

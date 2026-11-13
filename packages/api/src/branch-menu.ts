import type { Product } from "./data/catalog";
import { BRANCHES, findBranch, type Branch } from "./data/shop";

// What each branch serves and how far it delivers. Shared by the storefront (to show the
// right menu and fee) and the orders router (to refuse anything the branch can't do).

/** Whether a branch makes this item. Drinks are everywhere; food depends on the kitchen. */
export function isAvailableAt(product: Product, branch: Branch | undefined) {
  if (!branch || product.kind === "drink") return true;
  return branch.kitchen === "full" || product.category === "appetizers";
}

/** Branches that make this item, for "try Adenta instead" hints. */
export function branchesServing(product: Product) {
  return BRANCHES.filter((b) => isAvailableAt(product, b));
}

export { findBranch };

// Delivery -------------------------------------------------------------------

export interface LatLng {
  lat: number;
  lng: number;
}

/** Roads in Accra are rarely straight; road distance is roughly this much longer. */
const ROAD_FACTOR = 1.3;
/** Average rider speed across town, for the arrival estimate. */
const MINUTES_PER_KM = 4;

/** Straight-line distance between two points, in kilometres. */
export function straightLineKm(a: LatLng, b: LatLng) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export type DeliveryQuote =
  | { ok: true; km: number; fee: number; etaMinutes: number }
  | { ok: false; reason: "no_delivery" | "too_far"; km?: number; message: string };

/**
 * The delivery fee from a branch to a pin: base fee plus a rate per road kilometre,
 * rounded up to the next cedi. Outside the branch's range, or at a pickup-only branch,
 * it says why instead.
 */
export function quoteDelivery(branch: Branch, to: LatLng, prepMinutes = 15): DeliveryQuote {
  if (!branch.delivery.enabled) {
    return { ok: false, reason: "no_delivery", message: `${branch.name} is pickup only.` };
  }
  const km = Math.round(straightLineKm(branch.location, to) * ROAD_FACTOR * 10) / 10;
  if (km > branch.delivery.maxKm) {
    return {
      ok: false,
      reason: "too_far",
      km,
      message: `That's about ${km} km from ${branch.name}, and it delivers up to ${branch.delivery.maxKm} km.`,
    };
  }
  const fee = Math.ceil(branch.delivery.baseFee + branch.delivery.perKm * km);
  return { ok: true, km, fee, etaMinutes: Math.round(prepMinutes + km * MINUTES_PER_KM) };
}

/** Other open branches that deliver to this pin, nearest first, for "switch branch" hints. */
export function branchesDeliveringTo(to: LatLng, except?: string) {
  return BRANCHES.filter((b) => b.id !== except && b.orderingOpen)
    .map((b) => ({ branch: b, quote: quoteDelivery(b, to) }))
    .filter((x): x is { branch: Branch; quote: Extract<DeliveryQuote, { ok: true }> } => x.quote.ok)
    .sort((a, b) => a.quote.km - b.quote.km);
}

/** The cheapest a delivery from this branch can be, for "from GH₵10" labels. */
export function lowestDeliveryFee(branch: Branch | undefined) {
  const options = (branch ? [branch] : BRANCHES).filter((b) => b.delivery.enabled);
  return options.length ? Math.min(...options.map((b) => b.delivery.baseFee)) : null;
}

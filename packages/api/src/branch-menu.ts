import type { Branch } from "./data/shop";

// How far a branch delivers and what it costs. Shared by the storefront (to show the fee) and
// the orders router (to charge it), so both get the same number. The prices come from the
// branch's DELIVERY service in SmartSale (see smartsale/rules.ts).

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
 * SmartSale's delivery price: the DELIVERY item's price plus its "cost per km" for each road
 * kilometre (fixed at the item price when it has no per-km option). Outside the branch's
 * range, or at a pickup-only branch, it says why instead.
 */
export function quoteDelivery(branch: Branch, to: LatLng, prepMinutes = 15): DeliveryQuote {
  if (!branch.delivery.enabled || !branch.location) {
    return { ok: false, reason: "no_delivery", message: `${branch.name} is pickup only right now.` };
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
  const { baseFee, perKm, byDistance } = branch.delivery;
  const fee = Math.round((baseFee + (byDistance ? perKm * km : 0)) * 100) / 100;
  return { ok: true, km, fee, etaMinutes: Math.round(prepMinutes + km * MINUTES_PER_KM) };
}

/** Other open branches that deliver to this pin, nearest first, for "switch branch" hints. */
export function branchesDeliveringTo(branches: Branch[], to: LatLng, except?: string) {
  return branches
    .filter((b) => b.id !== except && b.orderingOpen)
    .map((b) => ({ branch: b, quote: quoteDelivery(b, to) }))
    .filter((x): x is { branch: Branch; quote: Extract<DeliveryQuote, { ok: true }> } => x.quote.ok)
    .sort((a, b) => a.quote.km - b.quote.km);
}

/** The cheapest a delivery can be, for "from GH₵10" labels. Null when nobody delivers. */
export function lowestDeliveryFee(branch: Branch | undefined, branches: Branch[] = []) {
  const options = (branch ? [branch] : branches).filter((b) => b.delivery.enabled);
  return options.length ? Math.min(...options.map((b) => b.delivery.baseFee)) : null;
}

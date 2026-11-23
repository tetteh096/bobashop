import type { PosItem, RawRegistration } from "./types";

// SmartSale's rules for online stores (API Reference, part 2), plus how its data is read.
// Values such as OPENED, DELIVERY or SERVICE are compared without regard to case.

export const norm = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value)).trim().toLowerCase();

export function toNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** POS prices arrive as 169.99000000000001. */
export const money = (value: unknown) => Math.round(toNumber(value) * 100) / 100;

// Branch visibility and ordering ------------------------------------------------

/** A store is listed unless SmartSale's cloud_config says `visible: false`. */
export function isVisible(reg: RawRegistration) {
  const visible = reg.cloud_config?.visible;
  if (typeof visible === "boolean") return visible;
  if (typeof visible === "string") return norm(visible) !== "false";
  return true;
}

/**
 * Rule 1: orders are taken only while at least one till (`pos_cashierN`) is OPENED.
 * A store that reports no tills at all takes orders.
 */
export function orderingStatus(reg: RawRegistration): { open: boolean; reason?: string } {
  const tills = Object.entries(reg).filter(([key]) => /^pos_cashier\d+$/i.test(key));
  if (tills.length === 0) return { open: true };
  const open = tills.some(([, till]) => norm((till as { status?: unknown } | null)?.status) === "opened");
  return open ? { open } : { open, reason: "All tills are closed" };
}

// Delivery ----------------------------------------------------------------------

export interface PosDelivery {
  enabled: boolean;
  /** The DELIVERY item's price. */
  baseFee: number;
  /** The "cost per km" option's price change; 0 when there isn't one. */
  perKm: number;
  /** Rule 3: a "location" attribute with a "cost per km" option turns on the map pin. */
  byDistance: boolean;
  /** Quoted back when the sale is posted. */
  item?: { posId: string; bin: string; dept: string; sku?: string };
}

const NO_DELIVERY: PosDelivery = { enabled: false, baseFee: 0, perKm: 0, byDistance: false };

/** Rule 2: delivery is on only while the store sells a SERVICE named DELIVERY with qty above 0. */
export function deliveryFrom(items: PosItem[]): PosDelivery {
  const item = items.find((p) => norm(p.name) === "delivery" && norm(p.type) === "service" && toNumber(p.qty) > 0);
  if (!item) return NO_DELIVERY;
  const perKmOption = item.attributes
    ?.find((a) => norm(a.name) === "location")
    ?.options?.find((o) => norm(o.value) === "cost per km");
  return {
    enabled: true,
    baseFee: money(item.price),
    perKm: perKmOption ? money(perKmOption.priceChange) : 0,
    byDistance: Boolean(perKmOption),
    item: { posId: item.posId, bin: item.bin, dept: item.dept || "DELIVERY", sku: item.sku },
  };
}

// Menu items --------------------------------------------------------------------

/**
 * Things a customer can buy: not services (delivery zones), not raw materials, named, and
 * priced, or with options that carry the price.
 */
export function isSellable(item: PosItem) {
  const type = norm(item.type);
  if (type === "service" || type === "raw material") return false;
  if (norm(item.category) === "delivery") return false;
  const description = norm(item.description);
  if (description === "service item" || description === "raw material item") return false;
  if (!item.name?.trim()) return false;
  return toNumber(item.price) > 0 || (item.attributes?.some((a) => a.options?.length) ?? false);
}

/**
 * Whether the store counts stock in the POS. Made-to-order shops often leave every qty at 0;
 * reading that as "sold out" would empty the menu. Once any item has stock, the counts are
 * taken as real and items at 0 or below show as sold out.
 */
export function tracksStock(items: PosItem[]) {
  return items.some((p) => isSellable(p) && toNumber(p.qty) > 0);
}

// Schedules ---------------------------------------------------------------------
// An item can be limited to some weekdays, every week or every other week from a start date.

/** The shops are in Ghana: "today" is Accra's date whatever the server's time zone. */
const STORE_TIME_ZONE = "Africa/Accra";
const DAY_MS = 86_400_000;

/** Monday = 0. SmartSale writes "Tues", "Thurs" and friends. */
const DAY_INDEX: Record<string, number> = {
  mon: 0, monday: 0,
  tue: 1, tues: 1, tuesday: 1,
  wed: 2, weds: 2, wednesday: 2,
  thu: 3, thur: 3, thurs: 3, thursday: 3,
  fri: 4, friday: 4,
  sat: 5, saturday: 5,
  sun: 6, sunday: 6,
};

/** Today's date in Accra, as UTC midnight. */
export function storeToday(now = new Date()) {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

const weekday = (date: Date) => (date.getUTCDay() + 6) % 7;
const weekStart = (date: Date) => date.getTime() - weekday(date) * DAY_MS;

/**
 * No days listed: every day. Days listed: only those weekdays, from the week of `startDate`
 * (DD/MM/YYYY) on; "Repeats Bi-Weekly" means every other week from that week.
 */
export function isScheduledFor(schedule: PosItem["schedule"], date: Date) {
  const days = (schedule?.days ?? "")
    .split(",")
    .map((d) => DAY_INDEX[norm(d)])
    .filter((d): d is number => d !== undefined);
  if (days.length === 0) return true;
  if (!days.includes(weekday(date))) return false;

  const match = schedule?.startDate?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return true;
  const start = new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
  const weeks = Math.round((weekStart(date) - weekStart(start)) / (7 * DAY_MS));
  if (weeks < 0) return false;
  return norm(schedule?.cycle) === "repeats bi-weekly" ? weeks % 2 === 0 : true;
}

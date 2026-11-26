import type { Category, Choice, MenuKind, Product } from "../data/catalog";
import { phoneFormats, type Branch } from "../data/shop";
import { fetchInventory, fetchRegistrations } from "./client";
import {
  deliveryFrom,
  isScheduledFor,
  isSellable,
  isVisible,
  money,
  norm,
  orderingStatus,
  storeToday,
  toNumber,
  tracksStock,
  type PosDelivery,
} from "./rules";
import type { PosItem, RawRegistration, SmartSaleConfig } from "./types";

// Turns SmartSale stores and inventory into the branches and menu the storefront shows.
// Everything shown comes from SmartSale as it is: no names, copy, photos or branches are added
// or changed here. The only site settings are how far a branch delivers (SmartSale has no
// field for it) and the illustration colour used when an item has no picture.

const slugify = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** `sserp_bobalicious_north_kaneshie` → `north-kaneshie`. */
export function branchSlug(storeId: string) {
  return slugify(storeId.replace(/^sserp_/i, "").replace(/^bobalicious_?/i, "")) || slugify(storeId);
}

/** "5.714755455603669, -0.1666325892662484" → { lat, lng }. */
function parseGps(raw: string | undefined) {
  const [lat, lng] = (raw ?? "").split(",").map((s) => Number(s.trim()));
  if (lat === undefined || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/** "Bobalicious Adenta" → "Adenta". */
function shortName(hostName: string) {
  return hostName.replace(/^bobalicious\s+/i, "").trim() || hostName.trim();
}

export interface PosBranch {
  storeId: string;
  branch: Branch;
  delivery: PosDelivery;
}

export function toBranch(storeId: string, reg: RawRegistration, items: PosItem[]): PosBranch {
  const info = reg.contact_info ?? {};
  const id = branchSlug(storeId);
  const name = shortName(info.hostName || info.name || "") || storeId;
  const address = (info.location || info.regAddress || info.address || "").split(/\s*\n\s*/).filter(Boolean).join(", ");
  const status = orderingStatus(reg);
  const delivery = deliveryFrom(items);
  const location = parseGps(info.gpsLocation);

  return {
    storeId,
    delivery,
    branch: {
      id,
      name,
      address,
      ...phoneFormats(info.phone ?? ""),
      location,
      online: true,
      orderingOpen: status.open,
      ...(!status.open && { closedMessage: `${name} isn't taking online orders right now.` }),
      delivery: {
        // Delivery by distance needs the branch's GPS location.
        enabled: delivery.enabled && (location !== null || !delivery.byDistance),
        baseFee: delivery.baseFee,
        perKm: delivery.perKm,
        byDistance: delivery.byDistance,
      },
    },
  };
}

// Menu --------------------------------------------------------------------------

/** Which tab a POS category goes under. Only sorts the menu; nothing shown is changed. */
const DRINK_CATEGORY = /\b(teas?|cups?|matcha|drinks?|water|smoothies?|milkshakes?|juices?|coffee|lattes?)\b/i;

function kindOf(category: string): MenuKind {
  return DRINK_CATEGORY.test(category) ? "drink" : "food";
}

/** Illustration tints for items with no POS picture. Decoration, not data. */
const TINT: Record<MenuKind, string> = { drink: "#E2C29A", food: "#F3C77A" };

/** Pictures on SmartSale's own storage. Anything else is ignored rather than shown broken. */
export const POS_IMAGE_HOST = "sserp-smartsaleerp.s3.eu-west-1.amazonaws.com";

function posPicture(url: string | undefined) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === POS_IMAGE_HOST ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function choicesFor(item: PosItem, basePrice: number): Choice[] {
  return (item.attributes ?? []).flatMap((attr) => {
    const name = attr.name?.trim();
    if (!name) return [];
    const seen = new Set<string>();
    const options = (attr.options ?? [])
      .map((o) => ({ value: (o.value ?? "").trim(), priceChange: money(o.priceChange) }))
      .sort((a, b) => a.priceChange - b.priceChange)
      // Cheapest first, so if the POS lists the same option twice ("Standard" +10 and +0), the
      // customer gets the lower price. Nothing that would cost nothing or less.
      .filter((o) => o.value && !seen.has(o.value) && seen.add(o.value) && basePrice + o.priceChange > 0);
    return options.length ? [{ name, options }] : [];
  });
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function firstSentence(s: string) {
  const sentence = s.split(/(?<=[.!?])\s/)[0] ?? "";
  return sentence.length > 90 ? `${sentence.slice(0, 87).trimEnd()}…` : sentence;
}

export interface PosMenu {
  categories: Category[];
  products: Product[];
  /** Product id → the POS item it sells, for pricing and posting orders. */
  pos: Map<string, PosItem>;
  tracksStock: boolean;
}

/** Items and sections in the order the POS holds them (bin by bin). */
export function toMenu(items: PosItem[], today = storeToday()): PosMenu {
  const counting = tracksStock(items);
  const products: Product[] = [];
  const pos = new Map<string, PosItem>();
  const categories = new Map<string, Category>();

  const ordered = [...items].sort(
    (a, b) => toNumber(a.bin.replace(/\D/g, "")) - toNumber(b.bin.replace(/\D/g, "")) || toNumber(a.posId) - toNumber(b.posId)
  );

  for (const item of ordered) {
    if (!isSellable(item) || !isScheduledFor(item.schedule, today)) continue;
    const rawCategory = (item.category || item.dept || "Menu").trim();
    const name = item.name!.trim();
    const price = money(item.price);
    const choices = choicesFor(item, price);
    if (price <= 0 && choices.length === 0) continue;

    const kind = kindOf(rawCategory);
    const category = slugify(rawCategory);
    if (!categories.has(category)) categories.set(category, { id: category, kind, name: titleCase(rawCategory) });

    const qty = toNumber(item.qty);
    const description = item.description?.trim() ?? "";
    let id = slugify(name);
    if (pos.has(id)) id = `${id}-${slugify(item.posId)}`;

    pos.set(id, item);
    products.push({
      id,
      kind,
      name,
      category,
      categoryName: titleCase(rawCategory),
      price,
      fromPrice: money(price + choices.reduce((sum, c) => sum + c.options[0]!.priceChange, 0)),
      choices,
      notes: firstSentence(description),
      description,
      image: posPicture(item.picture),
      color: TINT[kind],
      inStock: !counting || qty > 0,
      ...(counting && { stockLeft: Math.max(0, qty) }),
    });
  }

  return { categories: [...categories.values()], products, pos, tracksStock: counting };
}

// Loading -------------------------------------------------------------------------

/** Every visible store registered in SmartSale, with its delivery settings from its inventory. */
export async function loadBranches(config: SmartSaleConfig, maxAgeMs?: number): Promise<PosBranch[]> {
  const registrations = await fetchRegistrations(config, maxAgeMs);
  const visible = Object.entries(registrations).filter(([, reg]) => reg && typeof reg === "object" && isVisible(reg));

  return Promise.all(
    visible.map(async ([storeId, reg]) => {
      try {
        return toBranch(storeId, reg, await fetchInventory(config, storeId, maxAgeMs));
      } catch (error) {
        console.error(`SmartSale: couldn't read ${storeId}'s inventory`, error);
        const failed = toBranch(storeId, reg, []);
        return { ...failed, branch: { ...failed.branch, orderingOpen: false, closedMessage: `${failed.branch.name}'s menu didn't load. Please try again in a minute.` } };
      }
    })
  );
}

export async function loadBranch(config: SmartSaleConfig, branchId: string, maxAgeMs?: number) {
  const all = await loadBranches(config, maxAgeMs);
  return all.find((b) => b.branch.id === branchId);
}

/** A branch, its SmartSale delivery settings and today's menu. Undefined if it isn't in SmartSale. */
export async function loadBranchMenu(config: SmartSaleConfig, branchId: string, maxAgeMs?: number) {
  const found = await loadBranch(config, branchId, maxAgeMs);
  if (!found) return undefined;
  const items = await fetchInventory(config, found.storeId, maxAgeMs);
  return { ...found, menu: toMenu(items) };
}

/** The branch whose menu to show before the customer picks one: the first taking orders. */
export function defaultBranch(branches: Branch[]) {
  return branches.find((b) => b.orderingOpen) ?? branches[0];
}

export { norm };

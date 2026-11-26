import type { Database } from "@bobashop/db";

// Fallback photos for menu items that have no picture in SmartSale.
//
// SmartSale stays the source of truth: its picture always wins. Only when an item has none do
// we look here, by the item's name. The photos are the shop's own Bolt Food listing photos,
// matched to SmartSale names (scripts/seed-item-images.ts). `url` is wherever our copy lives:
// /images/... in the site today, Cloudflare R2 later. Moving them only changes the URLs here.

export type ItemImageDoc = {
  /** The SmartSale item name, normalised (see imageKey). */
  key: string;
  /** The SmartSale item name as it was when matched, for people reading the collection. */
  name: string;
  url: string;
  /** Where the photo came from, e.g. "bolt". */
  source: string;
  updatedAt: Date;
};

export const ITEM_IMAGES_COLLECTION = "item_images";

/** "Pina Colada  Milk-Tea" → "pina colada milk tea". */
export function imageKey(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** The fallbacks rarely change; re-read them every few minutes, not on every menu request. */
const TTL_MS = 5 * 60_000;
let cache: { at: number; byKey: Map<string, string> } | undefined;

export async function loadItemImages(db: Database | null): Promise<Map<string, string>> {
  if (!db) return new Map();
  if (cache && Date.now() - cache.at < TTL_MS) return cache.byKey;
  try {
    const docs = await db.collection<ItemImageDoc>(ITEM_IMAGES_COLLECTION).find({}, { projection: { key: 1, url: 1 } }).toArray();
    cache = { at: Date.now(), byKey: new Map(docs.map((d) => [d.key, d.url])) };
  } catch (error) {
    // No database just now: keep showing the last copy, or none. The menu itself still works.
    console.error("Item images: couldn't read fallbacks", error);
    if (!cache) return new Map();
  }
  return cache.byKey;
}

/** Fills in a fallback photo for each product SmartSale has no picture for. */
export async function withFallbackImages<T extends { name: string; image?: string }>(db: Database | null, products: T[]): Promise<T[]> {
  if (products.every((p) => p.image)) return products;
  const byKey = await loadItemImages(db);
  if (byKey.size === 0) return products;
  return products.map((p) => (p.image ? p : { ...p, image: byKey.get(imageKey(p.name)) ?? p.image }));
}

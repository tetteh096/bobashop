import type { PosItem, RawProduct, Registrations, SmartSaleConfig } from "./types";

// Reads from and writes to SmartSale's Firebase database over its REST API.
//
// Each branch's whole inventory is one request (`/inventory.json`), not one per bin, and
// results are shared for a few seconds across visitors so a busy menu doesn't multiply
// Firebase reads. If Firebase is unreachable, the last good copy keeps the menu up.

/** How long a read is reused. Short, so prices, stock and till status stay close to live. */
const FRESH_MS = 15_000;
/** How long an old copy may stand in while Firebase is failing. */
const STALE_MS = 10 * 60_000;
const TIMEOUT_MS = 8_000;

/** After a failed read, serve the old copy without retrying for this long. */
const RETRY_MS = 20_000;

/** `at`: when `value` was read. `retryAt`: don't call Firebase again before this. */
type Entry<T> = { at: number; value?: T; pending?: Promise<T>; retryAt?: number };
const cache = new Map<string, Entry<unknown>>();

async function cached<T>(key: string, load: () => Promise<T>, maxAgeMs = FRESH_MS): Promise<T> {
  const entry = cache.get(key) as Entry<T> | undefined;
  const now = Date.now();
  if (entry?.value !== undefined && (now - entry.at < maxAgeMs || (entry.retryAt ?? 0) > now)) return entry.value;
  if (entry?.pending) return entry.pending;

  const pending = load()
    .then((value) => {
      cache.set(key, { at: Date.now(), value });
      return value;
    })
    .catch((error) => {
      if (entry?.value !== undefined && Date.now() - entry.at < STALE_MS) {
        console.warn(`SmartSale: ${key} failed, using a copy from ${Math.round((Date.now() - entry.at) / 1000)}s ago`, error);
        cache.set(key, { at: entry.at, value: entry.value, retryAt: Date.now() + RETRY_MS });
        return entry.value;
      }
      cache.delete(key);
      throw error;
    });
  cache.set(key, { ...entry, at: entry?.at ?? 0, pending });
  return pending;
}

function url(config: SmartSaleConfig, path: string) {
  return `${config.baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(config.orgUuid)}/${path}.json`;
}

/** Store IDs come from SmartSale itself, but they go into a URL path, so keep them plain. */
function assertStoreId(storeId: string) {
  if (!/^[\w-]+$/.test(storeId)) throw new Error(`Invalid SmartSale store ID: ${storeId}`);
}

async function getJson<T>(config: SmartSaleConfig, path: string): Promise<T> {
  const res = await fetch(url(config, path), { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`SmartSale ${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Every store registered for online ordering, keyed by store ID (`sserp_bobalicious_adenta`). */
export function fetchRegistrations(config: SmartSaleConfig, maxAgeMs?: number) {
  return cached(
    `registrations:${config.orgUuid}`,
    async () => (await getJson<Registrations | null>(config, "onlinestores/registrations")) ?? {},
    maxAgeMs
  );
}

/** Firebase keys sometimes arrive wrapped in quotes: `"\"102\""`. */
function cleanKey(key: string) {
  return key.replace(/^"+|"+$/g, "").replace(/\\"/g, '"');
}

/** A bin is stored as `bin3`; registrations sometimes list it as `3`. */
export function binKey(bin: string) {
  return /^\d+$/.test(bin) ? `bin${bin}` : bin;
}

/** Every item in a store, from all its bins, in one request. */
export function fetchInventory(config: SmartSaleConfig, storeId: string, maxAgeMs?: number) {
  assertStoreId(storeId);
  return cached(
    `inventory:${config.orgUuid}:${storeId}`,
    async () => {
      const bins = (await getJson<Record<string, Record<string, RawProduct> | null> | null>(config, `onlinestores/${storeId}/inventory`)) ?? {};
      const items: PosItem[] = [];
      for (const [bin, products] of Object.entries(bins)) {
        if (!products || typeof products !== "object") continue;
        for (const [key, product] of Object.entries(products)) {
          if (product && typeof product === "object") items.push({ ...product, posId: cleanKey(key), bin: binKey(bin) });
        }
      }
      return items;
    },
    maxAgeMs
  );
}

/**
 * Queues a request for the store's POS (e.g. SubmitPaymentOnNewSale). Firebase answers with the
 * key it stored it under, which identifies the request if the shop asks about it later.
 */
export async function postServerRequest(config: SmartSaleConfig, storeId: string, payload: unknown) {
  assertStoreId(storeId);
  const res = await fetch(url(config, `onlinestores/${storeId}/server_requests`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SmartSale server_requests: HTTP ${res.status} ${text.slice(0, 200)}`);
  try {
    return (JSON.parse(text) as { name?: string } | null)?.name ?? null;
  } catch {
    return null;
  }
}

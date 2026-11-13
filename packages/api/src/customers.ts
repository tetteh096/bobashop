import type { Database } from "@bobashop/db";
import type { LatLng } from "./branch-menu";

// Returning customers: a phone number or email brings back the details from their last
// order, so checkout doesn't make them type everything again.

export interface CustomerProfile {
  fullName: string;
  phone: string;
  email: string;
  method: "delivery" | "pickup";
  address?: string;
  landmark?: string;
  ghanaPostGps?: string;
  location?: LatLng;
  branchId?: string;
}

/** 024 123 4567, +233 24 123 4567 and 233241234567 are all the same number. */
export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return `0${digits.slice(3)}`;
  if (digits.length === 9) return `0${digits}`;
  return digits.length === 10 ? digits : null;
}

export function normalizeEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/*
 * MOCK customers so the "welcome back" flow can be tried without a database or past orders.
 * Try 024 123 4567 or kofi@example.com at checkout. Remove these before going live.
 */
const MOCK_CUSTOMERS: CustomerProfile[] = [
  {
    fullName: "Ama Mensah",
    phone: "024 123 4567",
    email: "ama@example.com",
    method: "delivery",
    address: "12 Lagos Avenue, East Legon, Accra",
    landmark: "Opposite the Total filling station",
    location: { lat: 5.6392, lng: -0.1561 },
    branchId: "east-legon",
  },
  {
    fullName: "Kofi Boateng",
    phone: "055 987 6543",
    email: "kofi@example.com",
    method: "pickup",
    branchId: "upsa",
  },
];

/** Customers who paid while this server has been running, for prototype mode without a database. */
const remembered = new Map<string, CustomerProfile>();

export function rememberCustomer(profile: CustomerProfile) {
  const phone = normalizePhone(profile.phone);
  const email = normalizeEmail(profile.email);
  if (phone) remembered.set(phone, profile);
  if (email) remembered.set(email, profile);
}

type StoredOrder = {
  customer: { fullName: string; email: string; phone: string };
  branch?: { id: string };
  fulfilment:
    | { method: "delivery"; address: string; landmark?: string; ghanaPostGps?: string; location: LatLng }
    | { method: "pickup" };
};

function fromOrder(order: StoredOrder): CustomerProfile {
  const f = order.fulfilment;
  return {
    ...order.customer,
    method: f.method,
    branchId: order.branch?.id,
    ...(f.method === "delivery" && { address: f.address, landmark: f.landmark, ghanaPostGps: f.ghanaPostGps, location: f.location }),
  };
}

export async function lookupCustomer(db: Database | null, query: string): Promise<CustomerProfile | null> {
  const email = normalizeEmail(query);
  const phone = email ? null : normalizePhone(query);
  if (!email && !phone) return null;
  const key = (email ?? phone)!;

  // Their latest paid order, when there's a database.
  if (db) {
    const all = db.collection<StoredOrder & { status: string; createdAt: Date }>("orders");
    const filter = email
      ? { "customer.email": { $regex: `^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }
      : { "customer.phone": { $in: phoneVariants(key) } };
    const last = await all.find({ status: "paid", ...filter }).sort({ createdAt: -1 }).limit(1).next();
    if (last) return fromOrder(last);
  }

  const known = remembered.get(key);
  if (known) return known;
  return MOCK_CUSTOMERS.find((c) => (email ? normalizeEmail(c.email) === key : normalizePhone(c.phone) === key)) ?? null;
}

/** The ways a stored phone number might have been typed. */
function phoneVariants(local: string) {
  const rest = local.slice(1);
  return [local, `+233${rest}`, `233${rest}`, `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`, `+233 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`];
}

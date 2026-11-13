// Everything that names or describes the business lives here, so rebranding is one file.
// Branch names, addresses and numbers are from Bobalicious Gh's Instagram (Nov 2026).
// Email and opening hours are still placeholders.

export interface BranchDelivery {
  enabled: boolean;
  /** Cedis charged for any delivery, before distance. */
  baseFee: number;
  /** Cedis per kilometre of road from the branch. */
  perKm: number;
  /** Furthest the branch delivers, in road kilometres. */
  maxKm: number;
}

export interface Branch {
  id: string;
  /** Short name customers use: "East Legon". */
  name: string;
  address: string;
  phone: string;
  telHref: string;
  /** International format without "+", for wa.me links. */
  whatsapp: string;
  mapQuery: string;
  /** Where the shop is; delivery is priced by distance from here. */
  location: { lat: number; lng: number };
  /** False while the branch isn't taking online orders (closed, or busy). */
  orderingOpen: boolean;
  closedMessage?: string;
  delivery: BranchDelivery;
  /** "full": the whole food menu. "bites": drinks and appetizers only. */
  kitchen: "full" | "bites";
}

function branch(
  id: string,
  name: string,
  address: string,
  phone: string,
  mapQuery: string,
  rest: Pick<Branch, "location" | "delivery" | "kitchen"> & Partial<Pick<Branch, "orderingOpen" | "closedMessage">>
): Branch {
  const local = phone.replace(/\s/g, "");
  const intl = `233${local.replace(/^0/, "")}`;
  return { id, name, address, phone, telHref: `tel:+${intl}`, whatsapp: intl, mapQuery, orderingOpen: true, ...rest };
}

const NO_DELIVERY: BranchDelivery = { enabled: false, baseFee: 0, perKm: 0, maxKm: 0 };

/*
 * MOCK branch settings, until the shop confirms them: pin locations are approximate,
 * delivery prices and ranges are placeholders, and which kitchens serve the full food
 * menu is a guess (the Hubtel food listing is the Adenta eatery). Set `orderingOpen: false`
 * on a branch to see how the site behaves when it isn't taking orders.
 */
export const BRANCHES: Branch[] = [
  branch("east-legon", "East Legon", "Starbites Road, East Legon", "0599 417 771", "Starbites East Legon Accra", {
    location: { lat: 5.6366, lng: -0.1608 },
    delivery: { enabled: true, baseFee: 10, perKm: 3, maxKm: 10 },
    kitchen: "full",
  }),
  branch("north-kaneshie", "North Kaneshie", "Holy Trinity Junction, North Kaneshie", "0256 074 699", "Holy Trinity North Kaneshie Accra", {
    location: { lat: 5.5866, lng: -0.2386 },
    delivery: { enabled: true, baseFee: 10, perKm: 3, maxKm: 10 },
    kitchen: "full",
  }),
  branch("adenta", "Adenta", "Inside Kmart Groceries, Adenta", "0256 074 695", "Kmart Adenta Accra", {
    location: { lat: 5.7095, lng: -0.1676 },
    delivery: { enabled: true, baseFee: 10, perKm: 3, maxKm: 12 },
    kitchen: "full",
  }),
  branch("ug-pent", "UG Pent Hall", "Pent Hostel, Block C, University of Ghana", "0256 116 246", "Pentagon Hostel University of Ghana Legon", {
    location: { lat: 5.6427, lng: -0.1858 },
    delivery: NO_DELIVERY,
    kitchen: "bites",
  }),
  branch("upsa", "UPSA", "University of Professional Studies, Accra", "0256 116 250", "UPSA Accra", {
    location: { lat: 5.6611, lng: -0.1664 },
    delivery: { enabled: true, baseFee: 8, perKm: 3, maxKm: 6 },
    kitchen: "bites",
  }),
];

/** Used where no branch has been chosen yet. */
const MAIN = BRANCHES[1]!;

export const SHOP = {
  name: "Bobalicious",
  tagline: "Boba & bites",
  legalName: "Bobalicious Gh",
  description:
    "Loaded milk teas, matcha and fruit teas, plus wings, shawarma and jollof. Five branches across Accra, pickup or delivery. Treat yourself, you deserve it.",
  phone: MAIN.phone,
  telHref: MAIN.telHref,
  whatsapp: MAIN.whatsapp,
  instagram: "https://www.instagram.com/bobalicious_gh/",
  instagramHandle: "@bobalicious_gh",
  email: "hello@example.com",
  address: `${BRANCHES.length} branches across Accra`,
  ghanaPostGps: "",
  hours: [
    { days: "Monday – Friday", time: "10:00 AM – 9:00 PM" },
    { days: "Saturday", time: "11:00 AM – 10:00 PM" },
    { days: "Sunday", time: "12:00 PM – 8:00 PM" },
  ],
  /** Roughly how long a pickup order takes to make. */
  pickupMinutes: 15,
  mapQuery: MAIN.mapQuery,
} as const;

export function findBranch(id: string | null | undefined) {
  return BRANCHES.find((b) => b.id === id);
}


// The business itself: name, social links and the site's own settings. Branches (names,
// addresses, phones, GPS, whether they take orders, delivery prices) come only from SmartSale.

export interface BranchDelivery {
  /** The branch's POS sells a DELIVERY service with stock. Otherwise it's pickup only. */
  enabled: boolean;
  /** Cedis charged for any delivery: the DELIVERY item's price. */
  baseFee: number;
  /** Cedis per kilometre: the DELIVERY item's "cost per km" option. 0 when the fee is fixed. */
  perKm: number;
  /** True when the fee depends on distance, so the customer must drop a pin. */
  byDistance: boolean;
}

/** A store registered in SmartSale. Every field comes from there. */
export interface Branch {
  /** Slug of the SmartSale store ID: `sserp_bobalicious_adenta` → "adenta". */
  id: string;
  /** contact_info.hostName without "Bobalicious ": "Adenta". */
  name: string;
  /** contact_info.location. */
  address: string;
  /** contact_info.phone, formatted. */
  phone: string;
  telHref: string;
  /** The same number in international format without "+", for wa.me links. */
  whatsapp: string;
  /** contact_info.gpsLocation. Without it the branch can't deliver by distance. */
  location: { lat: number; lng: number } | null;
  /** Always true: only SmartSale stores are listed. Kept so older saved data reads the same. */
  online: boolean;
  /** At least one POS till (pos_cashierN) is OPENED. */
  orderingOpen: boolean;
  closedMessage?: string;
  delivery: BranchDelivery;
}

/** "0599 417 771", "tel:+233599417771" and "233599417771" from any Ghana number. */
export function phoneFormats(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const national = digits.startsWith("233") ? digits.slice(3) : digits.replace(/^0/, "");
  const intl = `233${national}`;
  const local = `0${national}`;
  return {
    phone: local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : raw.trim(),
    telHref: `tel:+${intl}`,
    whatsapp: intl,
  };
}


export const SHOP = {
  name: "Bobalicious",
  tagline: "Boba & bites",
  legalName: "Bobalicious Gh",
  description:
    "Loaded milk teas, matcha and fruit teas, plus pizza, wings, shawarma and jollof. Pickup or delivery in Accra. Treat yourself, you deserve it.",
  instagram: "https://www.instagram.com/bobalicious_gh/",
  instagramHandle: "@bobalicious_gh",
  email: "hello@example.com",
  hours: [
    { days: "Monday – Friday", time: "10:00 AM – 9:00 PM" },
    { days: "Saturday", time: "11:00 AM – 10:00 PM" },
    { days: "Sunday", time: "12:00 PM – 8:00 PM" },
  ],
  /** Roughly how long a pickup order takes to make. */
  pickupMinutes: 15,
} as const;

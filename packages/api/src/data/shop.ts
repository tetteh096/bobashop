// Everything that names or describes the business lives here, so rebranding is one file.
// These are placeholders until the real business details arrive.

export const SHOP = {
  name: "Bobalicious",
  tagline: "Tea bar",
  legalName: "Bobalicious",
  description:
    "Boba built on real tea. Single-origin leaves brewed fresh and poured over pearls we cook by hand. Order ahead for pickup or delivery.",
  phone: "+233 20 000 0000",
  telHref: "tel:+233200000000",
  whatsapp: "233200000000",
  email: "hello@example.com",
  address: "Shop address, Accra",
  ghanaPostGps: "GA-000-0000",
  hours: [
    { days: "Monday – Friday", time: "10:00 AM – 9:00 PM" },
    { days: "Saturday", time: "11:00 AM – 10:00 PM" },
    { days: "Sunday", time: "12:00 PM – 8:00 PM" },
  ],
  /** Roughly how long a pickup order takes to make. */
  pickupMinutes: 15,
  mapQuery: "Accra, Ghana",
} as const;

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  hours: string;
}

export const PICKUP_POINTS: PickupPoint[] = [
  {
    id: "main-shop",
    name: `${SHOP.legalName}`,
    address: SHOP.address,
    hours: "Mon – Fri 10 AM – 9 PM, Sat 11 AM – 10 PM, Sun 12 – 8 PM",
  },
];

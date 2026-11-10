// The menu lives in @bobashop/api so the server prices orders from the same list the
// storefront shows. Prices are placeholders until the real menu arrives.

export type CategoryId = "milk-tea" | "fruit-tea" | "matcha" | "seasonal";
export type OriginId = "taiwan" | "india" | "japan";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
}

export interface Origin {
  id: OriginId;
  name: string;
  teas: string;
  text: string;
}

export type SizeId = "regular" | "large";
export type SweetnessId = "0" | "25" | "50" | "75" | "100";
export type IceId = "none" | "less" | "regular" | "hot";
export type ToppingId = "pearls" | "foam" | "pudding" | "lychee-jelly" | "grass-jelly" | "popping-mango";

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  origin: OriginId;
  /** The tea leaf the drink is built on, shown on the card and product page. */
  tea: string;
  /** Price of a regular cup, including anything in `included`. */
  price: number;
  /** One line for cards. */
  notes: string;
  description: string;
  caffeine: "None" | "Low" | "Medium" | "High";
  /** Colour of the drink, used for the illustrated cup until there's a photo. */
  color: string;
  /** Toppings that come in the drink at no extra cost. */
  included?: ToppingId[];
  /** Fruit teas and slushies can't be served hot. */
  canBeHot: boolean;
  dairyFree?: boolean;
  badge?: "Best seller" | "New" | "Seasonal";
  inStock: boolean;
  /** Optional top-down photo; without one the card shows an illustrated cup. */
  image?: string;
}

export interface DrinkOptions {
  size: SizeId;
  sweetness: SweetnessId;
  ice: IceId;
  toppings: ToppingId[];
}

export const CATEGORIES: Category[] = [
  { id: "milk-tea", name: "Milk tea", blurb: "Strong-brewed tea with fresh or oat milk" },
  { id: "fruit-tea", name: "Fruit tea", blurb: "Light tea shaken with real fruit" },
  { id: "matcha", name: "Matcha", blurb: "Stone-ground Uji matcha, whisked to order" },
  { id: "seasonal", name: "Seasonal", blurb: "Here for a few weeks only" },
];

export const ORIGINS: Origin[] = [
  {
    id: "taiwan",
    name: "Taiwan",
    teas: "Oolong · Jasmine · Four Seasons",
    text: "High-mountain oolong and jasmine green, rolled by hand: floral, creamy and clean.",
  },
  {
    id: "india",
    name: "India",
    teas: "Assam · Earl Grey",
    text: "Malty Assam black tea from the Brahmaputra valley, strong enough to stand up to milk.",
  },
  {
    id: "japan",
    name: "Japan",
    teas: "Matcha · Hojicha",
    text: "Shade-grown Uji matcha and roasted hojicha, whisked to order every time.",
  },
];

export const SIZES: { id: SizeId; name: string; extra: number }[] = [
  { id: "regular", name: "Regular", extra: 0 },
  { id: "large", name: "Large", extra: 8 },
];

export const SWEETNESS: { id: SweetnessId; name: string }[] = [
  { id: "0", name: "0%" },
  { id: "25", name: "25%" },
  { id: "50", name: "50%" },
  { id: "75", name: "75%" },
  { id: "100", name: "100%" },
];

export const ICE: { id: IceId; name: string }[] = [
  { id: "none", name: "No ice" },
  { id: "less", name: "Less ice" },
  { id: "regular", name: "Regular ice" },
  { id: "hot", name: "Hot" },
];

export const TOPPINGS: { id: ToppingId; name: string; price: number }[] = [
  { id: "pearls", name: "Brown sugar pearls", price: 6 },
  { id: "foam", name: "Cream cheese foam", price: 8 },
  { id: "pudding", name: "Egg pudding", price: 7 },
  { id: "lychee-jelly", name: "Lychee jelly", price: 6 },
  { id: "grass-jelly", name: "Grass jelly", price: 6 },
  { id: "popping-mango", name: "Popping mango pearls", price: 7 },
];

export const MAX_TOPPINGS = 3;

export const PRODUCTS: Product[] = [
  {
    id: "brown-sugar-oolong",
    name: "Brown Sugar Oolong",
    category: "milk-tea",
    origin: "taiwan",
    tea: "Roasted oolong",
    price: 48,
    notes: "Roasted oolong, fresh milk, tiger-stripe syrup",
    description:
      "Roasted Taiwanese oolong brewed strong, poured over fresh milk and warm tapioca pearls rested in dark brown sugar syrup. Toasty and caramel-sweet, with the tea still clearly in front.",
    caffeine: "Medium",
    color: "#B98A5E",
    included: ["pearls"],
    canBeHot: true,
    badge: "Best seller",
    inStock: true,
  },
  {
    id: "jasmine-milk-tea",
    name: "Jasmine Milk Tea",
    category: "milk-tea",
    origin: "taiwan",
    tea: "Jasmine green",
    price: 40,
    notes: "Floral jasmine green with whole milk",
    description: "Jasmine-scented green tea with whole milk. Light, floral and very easy to drink, with pearls if you like.",
    caffeine: "Low",
    color: "#D8CC8F",
    canBeHot: true,
    inStock: true,
  },
  {
    id: "assam-milk-tea",
    name: "Assam Milk Tea",
    category: "milk-tea",
    origin: "india",
    tea: "Assam black",
    price: 40,
    notes: "Malty, bold black tea with condensed milk",
    description: "The classic: bold, malty Assam black tea with a splash of condensed milk. Strong enough to taste through any topping.",
    caffeine: "High",
    color: "#C98A55",
    canBeHot: true,
    inStock: true,
  },
  {
    id: "earl-grey-lavender",
    name: "Earl Grey Lavender",
    category: "milk-tea",
    origin: "india",
    tea: "Earl Grey",
    price: 46,
    notes: "Bergamot black tea, lavender cream top",
    description: "Bergamot-scented black tea with milk, finished with a soft lavender cream that slowly sinks into the cup.",
    caffeine: "Medium",
    color: "#B7A3B8",
    canBeHot: true,
    inStock: true,
  },
  {
    id: "uji-matcha-latte",
    name: "Uji Matcha Latte",
    category: "matcha",
    origin: "japan",
    tea: "Uji matcha",
    price: 50,
    notes: "Shade-grown matcha whisked to order",
    description: "Ceremonial-grade Uji matcha, whisked by hand for every cup and poured over cold milk. Grassy, sweet and a little savoury.",
    caffeine: "Medium",
    color: "#8FA45A",
    canBeHot: true,
    inStock: true,
  },
  {
    id: "strawberry-matcha",
    name: "Strawberry Matcha",
    category: "matcha",
    origin: "japan",
    tea: "Uji matcha",
    price: 55,
    notes: "Matcha floated over strawberry milk",
    description: "Fresh strawberry purée and milk, with whisked matcha floated on top. Stir it, or sip it in layers.",
    caffeine: "Medium",
    color: "#C7D18F",
    canBeHot: false,
    badge: "New",
    inStock: true,
  },
  {
    id: "lychee-oolong",
    name: "Lychee Oolong",
    category: "fruit-tea",
    origin: "taiwan",
    tea: "Four Seasons oolong",
    price: 42,
    notes: "Light oolong shaken with lychee and jelly",
    description: "Four Seasons oolong shaken with lychee and served over lychee jelly. Bright, fragrant and not too sweet.",
    caffeine: "Low",
    color: "#E6D2C2",
    included: ["lychee-jelly"],
    canBeHot: false,
    dairyFree: true,
    inStock: true,
  },
  {
    id: "strawberry-black",
    name: "Strawberry Black Tea",
    category: "fruit-tea",
    origin: "india",
    tea: "Assam black",
    price: 42,
    notes: "Fresh strawberry purée over iced black tea",
    description: "Iced Assam black tea over fresh strawberry purée. Fruity first, then a clean, brisk tea finish.",
    caffeine: "High",
    color: "#D9727E",
    canBeHot: false,
    dairyFree: true,
    inStock: true,
  },
  {
    id: "mango-jasmine",
    name: "Mango Jasmine",
    category: "fruit-tea",
    origin: "taiwan",
    tea: "Jasmine green",
    price: 44,
    notes: "Ripe mango and jasmine green, dairy-free",
    description: "Ripe mango shaken with jasmine green tea and finished with popping mango pearls. Sunshine in a cup.",
    caffeine: "Low",
    color: "#E8B95A",
    included: ["popping-mango"],
    canBeHot: false,
    dairyFree: true,
    inStock: true,
  },
  {
    id: "hojicha-latte",
    name: "Hojicha Latte",
    category: "seasonal",
    origin: "japan",
    tea: "Roasted hojicha",
    price: 48,
    notes: "Toasty roasted green tea with oat milk",
    description: "Roasted Japanese green tea with oat milk. Nutty and toasty with very little bitterness, and lower in caffeine.",
    caffeine: "Low",
    color: "#9B6B4A",
    canBeHot: true,
    dairyFree: true,
    badge: "Seasonal",
    inStock: true,
  },
  {
    id: "taro-roasted-milk",
    name: "Taro Roasted Milk",
    category: "seasonal",
    origin: "taiwan",
    tea: "Roasted oolong",
    price: 52,
    notes: "Hand-mashed taro with a cold-foam cap",
    description: "Hand-mashed taro stirred into roasted oolong milk tea, topped with salted cream cheese foam.",
    caffeine: "Low",
    color: "#A894C9",
    included: ["foam"],
    canBeHot: true,
    badge: "Seasonal",
    inStock: true,
  },
  {
    id: "black-sesame-milk",
    name: "Black Sesame Milk",
    category: "seasonal",
    origin: "india",
    tea: "Assam black",
    price: 50,
    notes: "Stone-ground sesame, Assam, honey pearls",
    description: "Stone-ground black sesame with Assam milk tea and pearls cooked in honey. Rich, nutty and a little smoky.",
    caffeine: "Medium",
    color: "#6E6660",
    included: ["pearls"],
    canBeHot: true,
    badge: "Seasonal",
    inStock: true,
  },
];

export function findProduct(id: string) {
  return PRODUCTS.find((product) => product.id === id);
}

export function categoryName(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function originName(id: OriginId) {
  return ORIGINS.find((o) => o.id === id)?.name ?? id;
}

export function toppingName(id: ToppingId) {
  return TOPPINGS.find((t) => t.id === id)?.name ?? id;
}

/** What a drink comes with if the customer doesn't change anything. */
export function defaultOptions(product: Product): DrinkOptions {
  return { size: "regular", sweetness: "50", ice: "less", toppings: [...(product.included ?? [])] };
}

/** Why a set of options can't be ordered, or null when it can. Shared by browser and server. */
export function optionsProblem(product: Product, options: DrinkOptions): string | null {
  if (!SIZES.some((s) => s.id === options.size)) return "Choose a size";
  if (!SWEETNESS.some((s) => s.id === options.sweetness)) return "Choose a sweetness";
  if (!ICE.some((i) => i.id === options.ice)) return "Choose how much ice";
  if (options.ice === "hot" && !product.canBeHot) return `${product.name} can't be served hot`;
  if (new Set(options.toppings).size !== options.toppings.length) return "A topping is listed twice";
  if (options.toppings.some((t) => !TOPPINGS.some((x) => x.id === t))) return "One of those toppings isn't on the menu";
  const extras = options.toppings.filter((t) => !product.included?.includes(t));
  if (extras.length > MAX_TOPPINGS) return `Up to ${MAX_TOPPINGS} extra toppings per drink`;
  return null;
}

/** Price of one cup with these options: base, plus size, plus any toppings it doesn't already include. */
export function unitPrice(product: Product, options: DrinkOptions) {
  const size = SIZES.find((s) => s.id === options.size)?.extra ?? 0;
  const toppings = options.toppings
    .filter((t) => !product.included?.includes(t))
    .reduce((sum, t) => sum + (TOPPINGS.find((x) => x.id === t)?.price ?? 0), 0);
  return product.price + size + toppings;
}

/** Toppings in menu order, so the same choices always make the same cart line. */
export function normaliseOptions(options: DrinkOptions): DrinkOptions {
  const order = TOPPINGS.map((t) => t.id);
  return { ...options, toppings: [...options.toppings].sort((a, b) => order.indexOf(a) - order.indexOf(b)) };
}

/** "Large · 50% sweet · Less ice · Brown sugar pearls" */
export function describeOptions(options: DrinkOptions) {
  const size = SIZES.find((s) => s.id === options.size)?.name;
  const ice = ICE.find((i) => i.id === options.ice)?.name;
  const parts = [size, `${options.sweetness}% sweet`, ice, ...options.toppings.map(toppingName)];
  return parts.filter(Boolean).join(" · ");
}

// The shape of the menu the storefront shows. Every item, price, choice and description comes
// from SmartSale, the shop's POS, per branch (see ../smartsale); the site adds nothing to it.
// Nothing here talks to the network, so the browser and the server share these helpers and
// price an item the same way.

export type MenuKind = "drink" | "food";

export interface Category {
  /** Slug of the POS category: "milk-tea-cup". */
  id: string;
  kind: MenuKind;
  /** The POS category, in title case: "MILK TEA CUP" → "Milk Tea Cup". */
  name: string;
}

export interface ChoiceOption {
  value: string;
  /** Added to the base price; can be negative. */
  priceChange: number;
}

/** A POS attribute, e.g. Size. The customer picks exactly one option. Cheapest first. */
export interface Choice {
  name: string;
  options: ChoiceOption[];
}

export interface Product {
  /** Slug of the item's name, so a cart or saved list carries over between branches. */
  id: string;
  kind: MenuKind;
  name: string;
  category: string;
  categoryName: string;
  /** Base price from the POS, before any choice. */
  price: number;
  /** Cheapest way to order it, for "from GH₵40" labels. */
  fromPrice: number;
  /** The item's POS attributes. */
  choices: Choice[];
  /** First sentence of the POS description, for cards. Empty when the POS has none. */
  notes: string;
  /** The POS description. */
  description: string;
  /** The POS picture, if one was uploaded. */
  image?: string;
  /** Tint for the illustration shown when there's no picture. Not POS data. */
  color: string;
  inStock: boolean;
  /** Units left, when the branch counts stock in the POS. */
  stockLeft?: number;
}

export interface ItemOptions {
  /** Choice name → chosen option value, e.g. { Size: "Large (700ml)" }. */
  choices: Record<string, string>;
}

/** What an item comes as if the customer doesn't change anything: the cheapest of each choice. */
export function defaultOptions(product: Product): ItemOptions {
  return { choices: Object.fromEntries(product.choices.map((c) => [c.name, c.options[0]!.value])) };
}

/** Why a set of options can't be ordered, or null when it can. Shared by browser and server. */
export function optionsProblem(product: Product, options: ItemOptions): string | null {
  for (const choice of product.choices) {
    const picked = options.choices[choice.name];
    if (!picked) return `Choose a ${choice.name.toLowerCase()}`;
    if (!choice.options.some((o) => o.value === picked)) return `${picked} isn't available`;
  }
  if (Object.keys(options.choices).some((name) => !product.choices.some((c) => c.name === name))) {
    return "One of those choices isn't on the menu";
  }
  return null;
}

/** The option chosen for each choice, with its price change. */
export function chosenOptions(product: Product, options: ItemOptions) {
  return product.choices.flatMap((choice) => {
    const option = choice.options.find((o) => o.value === options.choices[choice.name]);
    return option ? [{ name: choice.name, ...option }] : [];
  });
}

/** Price of one with these options: the POS base price plus each chosen option's change. */
export function unitPrice(product: Product, options: ItemOptions) {
  const change = chosenOptions(product, options).reduce((sum, o) => sum + o.priceChange, 0);
  return Math.round((product.price + change) * 100) / 100;
}

/** Choices in a fixed key order, so the same choices make the same cart line. */
export function normaliseOptions(options: ItemOptions): ItemOptions {
  return { choices: Object.fromEntries(Object.entries(options.choices ?? {}).sort(([a], [b]) => a.localeCompare(b))) };
}

/** "Large (700ml)" */
export function describeOptions(options: ItemOptions, product?: Product) {
  const picked = product ? product.choices.map((c) => options.choices[c.name]) : Object.values(options.choices);
  return picked.filter(Boolean).join(" · ");
}

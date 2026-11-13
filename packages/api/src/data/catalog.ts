// The menu lives in @bobashop/api so the server prices orders from the same list the
// storefront shows. Drinks, sections and prices are from the Bobalicious Gh listing on
// Bolt Food (North Kaneshie, Nov 2026). Bolt prices are usually marked up, so swap in the
// in-store prices before going live. Drink photos are the shop's own, from the same listing.
// Food is from the Bobalicious Eatery listing on Hubtel (Adenta, Nov 2026); items marked
// `askPrice` are priced by pieces or options there, so they're ordered on WhatsApp for now.

export type DrinkCategoryId = "lite" | "signature" | "matcha" | "fruit";
export type FoodCategoryId = "appetizers" | "wings" | "fries" | "rice" | "noodles" | "shawarma";
export type CategoryId = DrinkCategoryId | FoodCategoryId;
export type MenuKind = "drink" | "food";

export interface Category {
  id: CategoryId;
  kind: MenuKind;
  name: string;
  blurb: string;
}

export type SizeId = "regular" | "large";
export type SweetnessId = "0" | "25" | "50" | "75" | "100";
export type IceId = "none" | "less" | "regular" | "hot";
export type ToppingId = "pearls" | "foam" | "pudding" | "lychee-jelly" | "popping-strawberry" | "popping-mango";

export interface Product {
  id: string;
  /** Drinks are made to order with size, sweetness, ice and toppings; food comes as listed. */
  kind: MenuKind;
  name: string;
  category: CategoryId;
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
  badge?: "Best seller" | "New" | "Promo";
  inStock: boolean;
  /** Photo of the item; drinks without one show an illustrated cup. */
  image?: string;
  /** Price depends on pieces or options we don't have yet: shown, but ordered on WhatsApp. */
  askPrice?: boolean;
}

export interface DrinkOptions {
  size: SizeId;
  sweetness: SweetnessId;
  ice: IceId;
  toppings: ToppingId[];
}

export const CATEGORIES: Category[] = [
  { id: "lite", kind: "drink", name: "Milk Tea Lite", blurb: "The classics, one price for all" },
  { id: "signature", kind: "drink", name: "Signature Milk Teas", blurb: "Loaded: Biscoff, Oreo, Kit Kat and more" },
  { id: "matcha", kind: "drink", name: "Matcha Series", blurb: "Green and creamy, five ways" },
  { id: "fruit", kind: "drink", name: "Fruit Teas", blurb: "Fruity, fresh and ice cold" },
  { id: "appetizers", kind: "food", name: "Appetizers", blurb: "Small bites to start, or to share" },
  { id: "wings", kind: "food", name: "Chicken Wings", blurb: "Four flavours, from honey-garlic to suya" },
  { id: "fries", kind: "food", name: "Fries", blurb: "Fries, sweet potato or yam, with fried chicken" },
  { id: "rice", kind: "food", name: "Rice", blurb: "Fried rice and jollof, plain or assorted" },
  { id: "noodles", kind: "food", name: "Noodles", blurb: "Stir-fried and loaded" },
  { id: "shawarma", kind: "food", name: "Shawarma", blurb: "Chicken, beef or mixed, regular or loaded" },
];

export const SIZES: { id: SizeId; name: string; extra: number }[] = [
  { id: "regular", name: "Regular", extra: 0 },
  { id: "large", name: "Large (700ml)", extra: 8 },
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

// Placeholder toppings and prices until the shop confirms its list.
export const TOPPINGS: { id: ToppingId; name: string; price: number }[] = [
  { id: "pearls", name: "Brown sugar pearls", price: 6 },
  { id: "popping-strawberry", name: "Strawberry popping pearls", price: 7 },
  { id: "popping-mango", name: "Mango popping pearls", price: 7 },
  { id: "lychee-jelly", name: "Lychee jelly", price: 6 },
  { id: "foam", name: "Cheese foam", price: 8 },
  { id: "pudding", name: "Egg pudding", price: 7 },
];

export const MAX_TOPPINGS = 3;

export const DRINKS: Product[] = [
  { id: "sweet-taro", kind: "drink", name: "Sweet Taro Milk Tea", category: "lite", price: 62.5, notes: "Creamy taro, the purple one", description: "Sweet, nutty taro blended into creamy milk tea. Purple, pretty and dangerously easy to finish.", caffeine: "Low", color: "#B39BC8", canBeHot: true, badge: "Best seller", inStock: true, image: "/images/drinks/sweet-taro.webp" },
  { id: "strawberry-milk-tea", kind: "drink", name: "Strawberry Milk Tea", category: "lite", price: 62.5, notes: "Strawberry and milk, pink and sweet", description: "Sweet strawberry shaken with milk tea. Pink, creamy and made for the 'gram.", caffeine: "Low", color: "#F2A7B5", canBeHot: true, inStock: true, image: "/images/drinks/strawberry-milk-tea.webp" },
  { id: "chocolate-milk-tea", kind: "drink", name: "Chocolate Milk Tea", category: "lite", price: 62.5, notes: "Rich cocoa, milky finish", description: "Rich cocoa and milk tea with a smooth, milky finish. Chocolate lovers, this one's yours.", caffeine: "Low", color: "#7A4A32", canBeHot: true, inStock: true, image: "/images/drinks/chocolate-milk-tea.webp" },
  { id: "brown-sugar-milk", kind: "drink", name: "Brown Sugar Milk", category: "lite", price: 62.5, notes: "Milk with caramelised brown sugar", description: "Cold milk over warm pearls soaked in caramelised brown sugar. Those tiger stripes, though.", caffeine: "None", color: "#D9B48A", included: ["pearls"], canBeHot: false, inStock: true, image: "/images/drinks/brown-sugar-milk.webp" },
  { id: "cappuccino", kind: "drink", name: "Cappuccino", category: "lite", price: 62.5, notes: "Espresso meets milk tea", description: "Espresso blended with milk tea and finished with foam. Your coffee and your boba in one cup.", caffeine: "High", color: "#A9784F", canBeHot: true, inStock: true, image: "/images/drinks/cappuccino.webp" },
  { id: "vanilla-milk-tea", kind: "drink", name: "Vanilla Milk Tea", category: "lite", price: 62.5, notes: "Smooth vanilla bean", description: "Smooth vanilla bean milk tea. Simple, sweet and always a good idea.", caffeine: "Low", color: "#EEDDB8", canBeHot: true, inStock: true, image: "/images/drinks/vanilla-milk-tea.webp" },
  { id: "lychee-milk-tea", kind: "drink", name: "Lychee Milk Tea", category: "lite", price: 62.5, notes: "Floral, sweet lychee", description: "Floral, juicy lychee in creamy milk tea.", caffeine: "Low", color: "#F1E4DA", canBeHot: true, inStock: true, image: "/images/drinks/lychee-milk-tea.webp" },
  { id: "mango-milk-tea", kind: "drink", name: "Mango Milk Tea", category: "lite", price: 62.5, notes: "Sunshine-sweet mango", description: "Ripe mango and milk tea. Tastes like Accra sunshine.", caffeine: "Low", color: "#F7C25E", canBeHot: true, inStock: true, image: "/images/drinks/mango-milk-tea.webp" },
  { id: "peach-milk-tea", kind: "drink", name: "Peach Milk Tea", category: "lite", price: 62.5, notes: "Soft, juicy peach", description: "Juicy peach in a soft, creamy milk tea.", caffeine: "Low", color: "#F6BE9A", canBeHot: true, inStock: true, image: "/images/drinks/peach-milk-tea.webp" },
  { id: "cocktail-milk-tea", kind: "drink", name: "Cocktail Milk Tea", category: "lite", price: 62.5, notes: "Mixed fruit, all in one", description: "A mix of fruit flavours in one creamy cup. Can't decide? Get this.", caffeine: "Low", color: "#F2A07B", canBeHot: true, inStock: true, image: "/images/drinks/cocktail-milk-tea.webp" },
  { id: "purple-blue-berry-milk", kind: "drink", name: "Purple Blue Berry Milk", category: "lite", price: 62.5, notes: "Blueberry milk, deep purple", description: "Blueberry and milk, deep purple and fruity.", caffeine: "None", color: "#8E7BC1", canBeHot: false, inStock: true, image: "/images/drinks/purple-blue-berry-milk.webp" },
  { id: "brown-sugar-fresh-milk", kind: "drink", name: "Brown Sugar Fresh Milk", category: "lite", price: 62.5, notes: "Fresh milk and brown sugar syrup", description: "Fresh milk poured over brown sugar syrup and soft pearls. A Bobalicious classic.", caffeine: "None", color: "#E2C29A", included: ["pearls"], canBeHot: false, badge: "Best seller", inStock: true, image: "/images/drinks/brown-sugar-fresh-milk.webp" },
  { id: "pineapple-milk-tea", kind: "drink", name: "Pineapple Milk Tea", category: "lite", price: 62.5, notes: "Tangy-sweet pineapple", description: "Tangy-sweet pineapple in creamy milk tea.", caffeine: "Low", color: "#F4D774", canBeHot: true, inStock: true, image: "/images/drinks/pineapple-milk-tea.webp" },
  { id: "brown-sugar-coffee-choco", kind: "drink", name: "Brown Sugar Coffee Choco", category: "lite", price: 62.5, notes: "Espresso, chocolate, brown sugar", description: "Espresso, chocolate and brown sugar. The study-session drink.", caffeine: "High", color: "#6F4430", canBeHot: true, inStock: true, image: "/images/drinks/brown-sugar-coffee-choco.webp" },
  { id: "pina-colada", kind: "drink", name: "Pina Colada Milk Tea", category: "signature", price: 93.8, notes: "Pineapple and coconut", description: "Pineapple and coconut milk tea. Holiday in a cup.", caffeine: "Low", color: "#F3E3A6", canBeHot: false, inStock: true, image: "/images/drinks/pina-colada.webp" },
  { id: "vanilla-biscoff-latte", kind: "drink", name: "Vanilla Biscoff Latte", category: "signature", price: 93.8, notes: "Biscoff, espresso, foamed milk", description: "Biscoff cookie butter, espresso and foamed milk. Sweet, spiced and seriously good.", caffeine: "High", color: "#C58C5A", canBeHot: false, inStock: true, image: "/images/drinks/vanilla-biscoff-latte.webp" },
  { id: "dirty-tiger", kind: "drink", name: "Dirty Tiger Milk Tea", category: "signature", price: 93.8, notes: "Milk with chocolate crumbles", description: "Creamy milk tea with brown sugar stripes and chocolate crumbles.", caffeine: "Low", color: "#C9A27E", included: ["pearls"], canBeHot: false, badge: "Best seller", inStock: true, image: "/images/drinks/dirty-tiger.webp" },
  { id: "strawberry-cheesecake", kind: "drink", name: "Strawberry Cheesecake Milk Tea", category: "signature", price: 93.8, notes: "Dessert in a cup", description: "Strawberry milk tea on a cheesecake-style base. Dessert, but you can sip it.", caffeine: "Low", color: "#F4B6BF", canBeHot: false, inStock: true, image: "/images/drinks/strawberry-cheesecake.webp" },
  { id: "caramel-lotus", kind: "drink", name: "Caramel Lotus", category: "signature", price: 101.6, notes: "Biscoff cookies, caramel drizzle", description: "Milk tea with Biscoff cookies and a caramel drizzle all the way down.", caffeine: "Low", color: "#C9874C", canBeHot: false, inStock: true, image: "/images/drinks/caramel-lotus.webp" },
  { id: "oreo-cookie-crush", kind: "drink", name: "Oreo Cookie Crush", category: "signature", price: 93.8, notes: "Crushed chocolate cookies", description: "Milk tea loaded with crushed chocolate cookies. Cookies and cream, boba style.", caffeine: "Low", color: "#8C8178", canBeHot: false, inStock: true, image: "/images/drinks/oreo-cookie-crush.webp" },
  { id: "straw-blu", kind: "drink", name: "Straw Blu Straw Blu", category: "signature", price: 101.6, notes: "Layered strawberry and blueberry", description: "Strawberry and blueberry milk tea, layered. Say it twice.", caffeine: "Low", color: "#C58FB8", canBeHot: false, inStock: true, image: "/images/drinks/straw-blu.webp" },
  { id: "unicorn-bliss", kind: "drink", name: "Unicorn Bliss", category: "signature", price: 109.4, notes: "Strawberry cream and gold dust", description: "Coconut milk tea with strawberry whipped cream and edible gold dust.", caffeine: "Low", color: "#F2C6DA", canBeHot: false, inStock: true },
  { id: "marshmallows", kind: "drink", name: "Marshmallows", category: "signature", price: 109.4, notes: "Topped with marshmallows", description: "Creamy milk tea topped with a pile of marshmallows.", caffeine: "Low", color: "#F1E3E0", canBeHot: false, inStock: true, image: "/images/drinks/marshmallows.webp" },
  { id: "kit-kat", kind: "drink", name: "Kit Kat", category: "signature", price: 125, notes: "Chocolate wafer bits on top", description: "Chocolate milk tea topped with crunchy chocolate wafer bits.", caffeine: "Low", color: "#8A5A3E", canBeHot: false, inStock: true, image: "/images/drinks/kit-kat.webp" },
  { id: "crunchy-pistachio", kind: "drink", name: "Crunchy Pistachio", category: "signature", price: 125, notes: "Creamy, nutty and chocolatey", description: "Creamy, nutty and chocolatey, in a 700ml cup.", caffeine: "Low", color: "#B9C48A", canBeHot: false, badge: "New", inStock: true, image: "/images/drinks/crunchy-pistachio.webp" },
  { id: "custard-caramel", kind: "drink", name: "Custard Caramel", category: "signature", price: 101.6, notes: "Egg custard, caramel finish", description: "Smooth egg custard milk tea with a caramel finish.", caffeine: "Low", color: "#E7C27E", included: ["pudding"], canBeHot: false, inStock: true, image: "/images/drinks/custard-caramel.webp" },
  { id: "matcha-milk-tea", kind: "drink", name: "Matcha Milk Tea", category: "matcha", price: 78.1, notes: "Premium green tea blend", description: "Premium matcha blended with creamy milk. Green, smooth and earthy.", caffeine: "Medium", color: "#9DB86A", canBeHot: true, inStock: true, image: "/images/drinks/matcha-milk-tea.webp" },
  { id: "mango-matcha", kind: "drink", name: "Mango Matcha", category: "matcha", price: 78.1, notes: "Matcha over mango", description: "Matcha floated over sweet mango. Stir it or sip it in layers.", caffeine: "Medium", color: "#C9C764", canBeHot: false, inStock: true, image: "/images/drinks/mango-matcha.webp" },
  { id: "coconut-matcha", kind: "drink", name: "Coconut Matcha", category: "matcha", price: 78.1, notes: "Matcha and coconut", description: "Matcha with creamy coconut.", caffeine: "Medium", color: "#B8CC8F", canBeHot: false, inStock: true, image: "/images/drinks/coconut-matcha.webp" },
  { id: "oreo-matcha", kind: "drink", name: "Oreo Matcha", category: "matcha", price: 78.1, notes: "Matcha with crushed Oreo", description: "Matcha milk tea with crushed Oreo cookies.", caffeine: "Medium", color: "#93A47A", canBeHot: false, inStock: true, image: "/images/drinks/oreo-matcha.webp" },
  { id: "white-chocolate-matcha", kind: "drink", name: "White Chocolate Matcha", category: "matcha", price: 78.1, notes: "Matcha and white chocolate", description: "Matcha with sweet white chocolate. Smooth and mellow.", caffeine: "Medium", color: "#C3D3A0", canBeHot: true, inStock: true, image: "/images/drinks/white-chocolate-matcha.webp" },
  { id: "strawberry-matcha", kind: "drink", name: "Strawberry Matcha", category: "matcha", price: 78.1, notes: "Matcha over strawberry purée", description: "Matcha over strawberry purée. Pink and green, sweet and earthy.", caffeine: "Medium", color: "#C7D18F", canBeHot: false, inStock: true, image: "/images/drinks/strawberry-matcha.webp" },
  { id: "passion-fruit-tea", kind: "drink", name: "Passion Fruit Tea", category: "fruit", price: 62.5, notes: "Passion fruit seeds and juice", description: "Iced tea shaken with passion fruit seeds and juice. Tangy and refreshing.", caffeine: "Low", color: "#F2B33D", canBeHot: false, dairyFree: true, inStock: true, image: "/images/drinks/passion-fruit-tea.webp" },
  { id: "pineapple-fruit-tea", kind: "drink", name: "Pineapple Fruit Tea", category: "fruit", price: 62.5, notes: "Iced tea with pineapple", description: "Iced tea shaken with pineapple.", caffeine: "Low", color: "#F4D35E", canBeHot: false, dairyFree: true, inStock: true, image: "/images/drinks/pineapple-fruit-tea.webp" },
  { id: "strawberrylicious", kind: "drink", name: "Strawberrylicious", category: "fruit", price: 70.3, notes: "Strawberry everything", description: "Strawberry fruit tea, bright red and very fresh.", caffeine: "Low", color: "#E85A6B", canBeHot: false, dairyFree: true, inStock: true, image: "/images/drinks/strawberrylicious.webp" },
  { id: "fruity-lemonade", kind: "drink", name: "Fruity Lemonade", category: "fruit", price: 70.3, notes: "Citrus lemonade, popping pearls", description: "Citrus lemonade with popping pearls of your choice, in a 700ml cup.", caffeine: "None", color: "#F7E27A", included: ["popping-strawberry"], canBeHot: false, dairyFree: true, inStock: true, image: "/images/drinks/fruity-lemonade.webp" },
  { id: "kiwi-slushie", kind: "drink", name: "Kiwi Slushie", category: "fruit", price: 85.9, notes: "Icy kiwi, 700ml", description: "An icy kiwi slushie in a 700ml cup.", caffeine: "None", color: "#9BCB5B", canBeHot: false, dairyFree: true, inStock: true, image: "/images/drinks/kiwi-slushie.webp" },
  { id: "mango-berry", kind: "drink", name: "Mango Berry", category: "fruit", price: 62.5, notes: "Mango and berry", description: "Mango and berries shaken with iced tea.", caffeine: "Low", color: "#F09A5C", canBeHot: false, dairyFree: true, inStock: true, image: "/images/drinks/mango-berry.webp" },
  { id: "mangolicious", kind: "drink", name: "Mangolicious Fruit Tea", category: "fruit", price: 62.5, notes: "Clear tea, all mango", description: "Clear tea with loads of mango. The one in our name.", caffeine: "Low", color: "#F6B642", canBeHot: false, dairyFree: true, inStock: true, image: "/images/drinks/mangolicious.webp" },
];


// Food, from Bobalicious Eatery on Hubtel.
export const FOOD_ITEMS: Product[] = [
  { id: "chicken-nuggets", kind: "food", name: "Chicken Nuggets", category: "appetizers", price: 0, notes: "Golden, crispy nuggets", description: "Crispy chicken nuggets, priced by the number of pieces.", caffeine: "None", color: "#F3C77A", canBeHot: false, inStock: true, image: "/images/food/chicken-nuggets.webp", askPrice: true },
  { id: "samosa", kind: "food", name: "Samosa", category: "appetizers", price: 35, notes: "4 pieces", description: "Four crisp, golden samosas.", caffeine: "None", color: "#E9B872", canBeHot: false, inStock: true, image: "/images/food/samosa.webp" },
  { id: "spring-rolls", kind: "food", name: "Spring Rolls", category: "appetizers", price: 35, notes: "4 pieces", description: "Four crispy spring rolls.", caffeine: "None", color: "#EBC48A", canBeHot: false, inStock: true, image: "/images/food/spring-rolls.webp" },
  { id: "crispy-chicken-wings", kind: "food", name: "Crispy Chicken Wings", category: "wings", price: 0, notes: "Honey, BBQ, soy, garlic and butter", description: "Prepared with honey, BBQ sauce, soy sauce, garlic and butter.", caffeine: "None", color: "#E4A15A", canBeHot: false, inStock: true, image: "/images/food/crispy-chicken-wings.webp", askPrice: true },
  { id: "hot-chili-wings", kind: "food", name: "Hot Chili Wings", category: "wings", price: 0, notes: "Scotch bonnet, chilli, garlic, lime", description: "Prepared with scotch bonnet, chilli flakes, garlic, ginger and lime.", caffeine: "None", color: "#E8764F", canBeHot: false, inStock: true, image: "/images/food/hot-chili-wings.webp", askPrice: true },
  { id: "spicy-bbq-wings", kind: "food", name: "Spicy BBQ Wings", category: "wings", price: 0, notes: "BBQ, cayenne, smoked paprika, honey", description: "Prepared with BBQ sauce, cayenne pepper, garlic, smoked paprika and honey.", caffeine: "None", color: "#C9683F", canBeHot: false, inStock: true, image: "/images/food/spicy-bbq-wings.webp", askPrice: true },
  { id: "suya-king-wings", kind: "food", name: "Suya King Wings", category: "wings", price: 0, notes: "Suya spice, peppers and onions", description: "Prepared with bell pepper, onions, suya spice and black pepper.", caffeine: "None", color: "#D98B4A", canBeHot: false, inStock: true, image: "/images/food/suya-king-wings.webp", askPrice: true },
  { id: "fries-fried-chicken", kind: "food", name: "French Fries with Fried Chicken", category: "fries", price: 65, notes: "Served with fried chicken", description: "Golden French fries served with fried chicken.", caffeine: "None", color: "#F4CF6B", canBeHot: false, inStock: true, image: "/images/food/fries-fried-chicken.webp" },
  { id: "loaded-fries", kind: "food", name: "Loaded Fries", category: "fries", price: 0, notes: "Cheese, seasoned chicken, signature sauce", description: "Crispy fries, melted cheese, seasoned chicken and our signature sauce.", caffeine: "None", color: "#F2B94E", canBeHot: false, inStock: true, image: "/images/food/loaded-fries.webp", askPrice: true },
  { id: "sweet-potato-fries-chicken", kind: "food", name: "Sweet Potato Fries with Fried Chicken", category: "fries", price: 65, notes: "Served with fried chicken", description: "Sweet potato fries served with fried chicken.", caffeine: "None", color: "#EFA45C", canBeHot: false, inStock: true, image: "/images/food/sweet-potato-fries-chicken.webp" },
  { id: "yam-chips-chicken", kind: "food", name: "Yam Chips with Fried Chicken", category: "fries", price: 60, notes: "Served with fried chicken", description: "Crispy yam chips served with fried chicken.", caffeine: "None", color: "#EBCB82", canBeHot: false, inStock: true, image: "/images/food/yam-chips-chicken.webp" },
  { id: "assorted-fried-rice", kind: "food", name: "Assorted Fried Rice", category: "rice", price: 95, notes: "Loaded with mixed meats", description: "Fried rice loaded with assorted meats and vegetables.", caffeine: "None", color: "#E9C46A", canBeHot: false, inStock: true, image: "/images/food/assorted-fried-rice.webp" },
  { id: "assorted-jollof-rice", kind: "food", name: "Assorted Jollof Rice", category: "rice", price: 95, notes: "Loaded with mixed meats", description: "Smoky jollof loaded with assorted meats.", caffeine: "None", color: "#E07A4A", canBeHot: false, inStock: true, image: "/images/food/assorted-jollof-rice.webp" },
  { id: "egg-fried-rice", kind: "food", name: "Egg Fried Rice", category: "rice", price: 55, notes: "Simple and satisfying", description: "Fried rice with egg and vegetables.", caffeine: "None", color: "#EED47E", canBeHot: false, inStock: true, image: "/images/food/egg-fried-rice.webp" },
  { id: "fried-rice", kind: "food", name: "Fried Rice", category: "rice", price: 0, notes: "With your choice of protein", description: "Classic fried rice with your choice of protein.", caffeine: "None", color: "#E6C46E", canBeHot: false, inStock: true, image: "/images/food/fried-rice.webp", askPrice: true },
  { id: "jollof-rice", kind: "food", name: "Jollof Rice", category: "rice", price: 0, notes: "With your choice of protein", description: "Smoky jollof rice with your choice of protein.", caffeine: "None", color: "#DD7346", canBeHot: false, inStock: true, image: "/images/food/jollof-rice.webp", askPrice: true },
  { id: "assorted-noodles", kind: "food", name: "Assorted Noodles", category: "noodles", price: 90, notes: "Stir-fried with mixed meats", description: "Stir-fried noodles with assorted meats and vegetables.", caffeine: "None", color: "#E3A45E", canBeHot: false, inStock: true, image: "/images/food/assorted-noodles.webp" },
  { id: "chicken-shawarma", kind: "food", name: "Chicken Shawarma", category: "shawarma", price: 60, notes: "Chicken, wrapped and toasted", description: "Chicken shawarma, wrapped and toasted. Ask about extras.", caffeine: "None", color: "#E8C48C", canBeHot: false, inStock: true, image: "/images/food/chicken-shawarma.webp" },
  { id: "beef-shawarma", kind: "food", name: "Beef Shawarma", category: "shawarma", price: 70, notes: "Beef, wrapped and toasted", description: "Beef shawarma, wrapped and toasted. Ask about extras.", caffeine: "None", color: "#D9A375", canBeHot: false, inStock: true, image: "/images/food/beef-shawarma.webp" },
  { id: "beef-loaded-shawarma", kind: "food", name: "Beef Loaded Shawarma", category: "shawarma", price: 80, notes: "Extra beef, extra everything", description: "Loaded beef shawarma with extra filling.", caffeine: "None", color: "#D49A6A", canBeHot: false, inStock: true, image: "/images/food/beef-loaded-shawarma.webp" },
  { id: "mix-loaded-shawarma", kind: "food", name: "Mix Loaded Shawarma", category: "shawarma", price: 80, notes: "Chicken and beef, loaded", description: "Loaded shawarma with chicken and beef.", caffeine: "None", color: "#DCA878", canBeHot: false, inStock: true, image: "/images/food/mix-loaded-shawarma.webp" },
];

/** Everything on the menu, drinks first. */
export const PRODUCTS: Product[] = [...DRINKS, ...FOOD_ITEMS];

export const DRINK_CATEGORIES = CATEGORIES.filter((c) => c.kind === "drink");
export const FOOD_CATEGORIES = CATEGORIES.filter((c) => c.kind === "food");

export function findProduct(id: string) {
  return PRODUCTS.find((product) => product.id === id);
}

export function categoryName(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function toppingName(id: ToppingId) {
  return TOPPINGS.find((t) => t.id === id)?.name ?? id;
}

/** Food has no options; its lines carry this fixed set so the bag and orders stay one shape. */
export const FOOD_OPTIONS: DrinkOptions = { size: "regular", sweetness: "50", ice: "regular", toppings: [] };

/** What an item comes with if the customer doesn't change anything. */
export function defaultOptions(product: Product): DrinkOptions {
  if (product.kind === "food") return { ...FOOD_OPTIONS };
  return { size: "regular", sweetness: "50", ice: "less", toppings: [...(product.included ?? [])] };
}

/** Why a set of options can't be ordered, or null when it can. Shared by browser and server. */
export function optionsProblem(product: Product, options: DrinkOptions): string | null {
  if (product.askPrice) return "price depends on your choice, so order it on WhatsApp";
  if (product.kind === "food") {
    const o = options;
    const plain = o.size === "regular" && o.sweetness === FOOD_OPTIONS.sweetness && o.ice === FOOD_OPTIONS.ice && o.toppings.length === 0;
    return plain ? null : "food comes as listed";
  }
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
  if (product.kind === "food") return product.price;
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
export function describeOptions(options: DrinkOptions, product?: Product) {
  if (product?.kind === "food") return "";
  const size = SIZES.find((s) => s.id === options.size)?.name;
  const ice = ICE.find((i) => i.id === options.ice)?.name;
  const parts = [size, `${options.sweetness}% sweet`, ice, ...options.toppings.map(toppingName)];
  return parts.filter(Boolean).join(" · ");
}

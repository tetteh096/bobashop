// Saves the fallback photo for each SmartSale item that has one, into Mongo's `item_images`.
//
//   pnpm -F @bobashop/api seed:images
//
// The photos are the shop's Bolt Food listing photos, kept in apps/web/public/images. Each was
// matched by hand to the SmartSale item with the same (or nearly the same) name; photos with no
// clear match are left out, so those items keep their illustration. Running it again updates
// the URLs and leaves other entries alone. When the photos move to Cloudflare R2, change BASE
// (or the URLs in Mongo) and rerun.

import { createDb } from "@bobashop/db";

import { imageKey, ITEM_IMAGES_COLLECTION, type ItemImageDoc } from "../src/item-images";

const BASE = "/images";

/** SmartSale item name → photo file under BASE. */
const MATCHES: Record<string, string> = {
  // Milk tea cup
  "Brown Sugar Coffee Choco": "drinks/brown-sugar-coffee-choco.webp",
  "Brown Sugar Fresh Milk": "drinks/brown-sugar-fresh-milk.webp",
  "Brown Sugar Milk Tea": "drinks/brown-sugar-milk.webp",
  "Cappuccino Milk Tea": "drinks/cappuccino.webp",
  "Chocolate Milk Tea": "drinks/chocolate-milk-tea.webp",
  "Cocktail Milk Tea": "drinks/cocktail-milk-tea.webp",
  "Lychee Milk Tea": "drinks/lychee-milk-tea.webp",
  "Mango Milk Tea": "drinks/mango-milk-tea.webp",
  "Matcha Milk Tea": "drinks/matcha-milk-tea.webp",
  "Peach Milk Tea": "drinks/peach-milk-tea.webp",
  "Pineapple Milk Tea": "drinks/pineapple-milk-tea.webp",
  "Purple Blueberry Milk Tea": "drinks/purple-blue-berry-milk.webp",
  "Strawberry Milk Tea": "drinks/strawberry-milk-tea.webp",
  "Sweet Taro Milk Tea": "drinks/sweet-taro.webp",
  "Vanilla Milk Tea": "drinks/vanilla-milk-tea.webp",
  // Fruit tea cup
  "Lemonade Fruit Tea": "drinks/fruity-lemonade.webp",
  "Mango Berry": "drinks/mango-berry.webp",
  "Mango Licious": "drinks/mangolicious.webp",
  "Passion Fruit Tea": "drinks/passion-fruit-tea.webp",
  "Pineapple Fruit Tea": "drinks/pineapple-fruit-tea.webp",
  "Strawberry Licious": "drinks/strawberrylicious.webp",
  // Signature cups
  "Caramel Lotus": "drinks/caramel-lotus.webp",
  "Crunchy Pistachio": "drinks/crunchy-pistachio.webp",
  "Custard Caramel": "drinks/custard-caramel.webp",
  "Dirty Tiger Milk Tea": "drinks/dirty-tiger.webp",
  "Kit Kat": "drinks/kit-kat.webp",
  "Kiwi Slushie Milk Tea": "drinks/kiwi-slushie.webp",
  "Oreo Cookie Crush": "drinks/oreo-cookie-crush.webp",
  "Pina Colada Milk Tea": "drinks/pina-colada.webp",
  "Straw Blu Straw Blu": "drinks/straw-blu.webp",
  "Strawberry Cheesecake Milk Tea": "drinks/strawberry-cheesecake.webp",
  "Vanilla Biscoff Latte": "drinks/vanilla-biscoff-latte.webp",
  // Matcha series
  "Coconut Matcha": "drinks/coconut-matcha.webp",
  "Oreo Matcha": "drinks/oreo-matcha.webp",
  "Strawberry Matcha": "drinks/strawberry-matcha.webp",
  "White Chocolate Matcha": "drinks/white-chocolate-matcha.webp",
  // Food
  "Assorted Fried Rice": "food/assorted-fried-rice.webp",
  "Assorted Jollof Rice": "food/assorted-jollof-rice.webp",
  "Assorted Noodles": "food/assorted-noodles.webp",
  "Beef Loaded Shawarma": "food/beef-loaded-shawarma.webp",
  "Beef Shawarma": "food/beef-shawarma.webp",
  "Chicken Nuggets": "food/chicken-nuggets.webp",
  "Chicken Shawarma": "food/chicken-shawarma.webp",
  "Crispy Chicken Wings": "food/crispy-chicken-wings.webp",
  "Egg Fried Rice": "food/egg-fried-rice.webp",
  "Hot Chili Wings": "food/hot-chili-wings.webp",
  "Jollof Rice": "food/jollof-rice.webp",
  "Mixed Loaded Shawarma": "food/mix-loaded-shawarma.webp",
  "Samosa (4pcs)": "food/samosa.webp",
  "Spicy BBQ Wings": "food/spicy-bbq-wings.webp",
  "Spring Rolls (4pcs)": "food/spring-rolls.webp",
  "Suya King Wings": "food/suya-king-wings.webp",
};

// Left out on purpose (no single clear SmartSale item): drinks/mango-matcha (Mango Matcha Luxe
// or Mangolicious Matcha?), drinks/marshmallows, food/fried-rice (three fried rices),
// food/loaded-fries (two loaded-fries boxes), food/fries-fried-chicken,
// food/sweet-potato-fries-chicken, food/yam-chips-chicken.

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL isn't set. Run with --env-file=../../apps/web/.env");

const db = await createDb({ DATABASE_URL: url });
const images = db.collection<ItemImageDoc>(ITEM_IMAGES_COLLECTION);
await images.createIndex({ key: 1 }, { unique: true });

const now = new Date();
const result = await images.bulkWrite(
  Object.entries(MATCHES).map(([name, file]) => ({
    updateOne: {
      filter: { key: imageKey(name) },
      update: { $set: { key: imageKey(name), name, url: `${BASE}/${file}`, source: "bolt", updatedAt: now } },
      upsert: true,
    },
  }))
);
console.log(`item_images: ${result.upsertedCount} added, ${result.modifiedCount} updated, ${Object.keys(MATCHES).length} matches in all.`);
process.exit(0);

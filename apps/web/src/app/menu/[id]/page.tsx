import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, categoryName, findProduct } from "@bobashop/api/data/catalog";
import { SHOP } from "@bobashop/api/data/shop";
import { Breadcrumb } from "@/components/arrow-button";
import { ProductArt } from "@/components/shop/product-art";
import { DrinkCustomizer } from "@/components/shop/drink-customizer";
import { FoodOrder } from "@/components/shop/food-order";
import { formatGHS } from "@/components/shop/money";
import { ProductCard } from "@/components/shop/product-card";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const product = findProduct((await params).id);
  return product
    ? { title: `${product.name} | ${SHOP.legalName}`, description: product.description }
    : { title: SHOP.legalName };
}

export default async function DrinkPage({ params }: { params: Promise<{ id: string }> }) {
  const product = findProduct((await params).id);
  if (!product) notFound();

  // Same category first, then anything else, never the drink itself.
  const isFood = product.kind === "food";
  const photo = Boolean(product.image) && !isFood;
  const related = [
    ...PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category),
    ...PRODUCTS.filter((p) => p.id !== product.id && p.category !== product.category && p.kind === product.kind),
  ].slice(0, 4);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-6 pb-24">
      <Breadcrumb items={[{ label: isFood ? "Food" : "Menu", href: isFood ? "/menu?tab=food" : "/menu" }, { label: product.name }]} />

      <div className="mt-8 sm:mt-10 flex flex-wrap gap-10 lg:gap-20 items-start">
        <div
          className={`relative flex-[1_1_420px] min-w-0 lg:sticky lg:top-28 rounded-[32px] overflow-hidden ${photo ? "aspect-[4/5]" : "aspect-square p-[10%]"}`}
          style={photo ? undefined : { background: `linear-gradient(160deg, ${product.color}66, ${product.color}26)` }}
        >
          <ProductArt product={product} className={photo ? "absolute inset-0 w-full h-full" : "w-full h-full"} sizes="(min-width: 1024px) 560px, 100vw" priority />
        </div>

        <div className="flex-[1_1_460px] min-w-0 flex flex-col gap-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-col gap-3">
              {product.badge && (
                <span className="self-start bg-tomato text-white text-xs tracking-wide px-2.5 py-1">{product.badge}</span>
              )}
              <h1 className="font-display text-[40px] sm:text-[56px] font-bold leading-none">{product.name}</h1>
            </div>
            <span className={`flex items-center gap-2 text-sm ${product.inStock ? "text-leaf" : "text-sale"}`}>
              <span className={`w-[7px] h-[7px] rounded-full ${product.inStock ? "bg-leaf" : "bg-sale"}`} />
              {product.inStock ? "Available today" : "Sold out today"}
            </span>
          </div>
          <p className="text-lg leading-relaxed text-ink/85">{product.description}</p>

          <dl className="grid grid-cols-3 gap-4 border-y border-ink py-4">
            <Spec label="Menu" value={categoryName(product.category)} />
            {isFood ? (
              <>
                <Spec label="Served" value="Hot, made to order" />
                <Spec label="Price" value={product.askPrice ? "Depends on choice" : formatGHS(product.price)} />
              </>
            ) : (
              <>
                <Spec label="Served" value={product.canBeHot ? "Iced or hot" : "Iced"} />
                <Spec label="Caffeine" value={product.caffeine} />
              </>
            )}
          </dl>

          {isFood ? <FoodOrder product={product} /> : <DrinkCustomizer product={product} />}
        </div>
      </div>

      <section className="mt-20 sm:mt-24">
        <h2 className="font-display text-2xl sm:text-[28px] font-normal">You might also like</h2>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-subtle">{label}</dt>
      <dd className="mt-1 text-base sm:text-[17px]">{value}</dd>
    </div>
  );
}

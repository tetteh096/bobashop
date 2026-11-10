import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, findProduct, originName } from "@bobashop/api/data/catalog";
import { SHOP } from "@bobashop/api/data/shop";
import { Breadcrumb } from "@/components/arrow-button";
import { ProductArt } from "@/components/shop/product-art";
import { DrinkCustomizer } from "@/components/shop/drink-customizer";
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
  const related = [
    ...PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category),
    ...PRODUCTS.filter((p) => p.id !== product.id && p.category !== product.category),
  ].slice(0, 4);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-6 pb-24">
      <Breadcrumb items={[{ label: "Menu", href: "/menu" }, { label: product.name }]} />

      <div className="mt-8 sm:mt-10 flex flex-wrap gap-10 lg:gap-20 items-start">
        <div className="flex-[1_1_420px] min-w-0 lg:sticky lg:top-28 bg-tint aspect-square flex items-center justify-center p-[12%]">
          <ProductArt product={product} className="w-full h-full" priority />
        </div>

        <div className="flex-[1_1_460px] min-w-0 flex flex-col gap-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-col gap-3">
              {product.badge && (
                <span className="self-start bg-tomato text-white text-xs tracking-wide px-2.5 py-1">{product.badge}</span>
              )}
              <h1 className="font-display text-[40px] sm:text-[56px] font-light leading-none">{product.name}</h1>
            </div>
            <span className={`flex items-center gap-2 text-sm ${product.inStock ? "text-leaf" : "text-sale"}`}>
              <span className={`w-[7px] h-[7px] rounded-full ${product.inStock ? "bg-leaf" : "bg-sale"}`} />
              {product.inStock ? "Available today" : "Sold out today"}
            </span>
          </div>
          <p className="text-lg leading-relaxed text-ink/85">{product.description}</p>

          <dl className="grid grid-cols-3 gap-4 border-y border-ink py-4">
            <Spec label="Tea" value={product.tea} />
            <Spec label="Origin" value={originName(product.origin)} />
            <Spec label="Caffeine" value={product.caffeine} />
          </dl>

          <DrinkCustomizer product={product} />
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

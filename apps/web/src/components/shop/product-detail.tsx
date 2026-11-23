"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/arrow-button";
import { useBranch } from "@/components/branch";
import { ProductArt } from "./product-art";
import { ItemCustomizer } from "./drink-customizer";
import { ProductCard } from "./product-card";
import { useMenu } from "./menu-context";
import { formatGHS } from "./money";

/** An item's page, from the chosen branch's menu (or the default branch's, before one is chosen). */
export function ProductDetail({ id }: { id: string }) {
  const { products, findProduct, loading, failed } = useMenu();
  const { branch, openPicker } = useBranch();
  const product = findProduct(id);

  if (loading) return <DetailSkeleton />;

  if (!product) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16">
        <div className="rounded-[32px] bg-card border border-line px-6 py-16 text-center flex flex-col items-center gap-3">
          <h1 className="font-display text-4xl font-bold">{failed ? "The menu didn't load" : "Not on the menu today"}</h1>
          <p className="text-subtle max-w-md">
            {failed
              ? "We couldn't reach the shop just now. Please try again in a minute."
              : `${branch ? `Bobalicious ${branch.name}` : "This branch"} isn't serving this today. Another branch might be.`}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className="inline-flex items-center min-h-12 px-6 rounded-full bg-brand-deep text-cream font-medium">
              See today&apos;s menu
            </Link>
            {!failed && (
              <button type="button" onClick={openPicker} className="min-h-12 px-6 rounded-full border border-line hover:border-ink font-medium cursor-pointer">
                Change branch
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Same section first, then anything else of the same kind, never the item itself.
  const isFood = product.kind === "food";
  const photo = Boolean(product.image) && !isFood;
  const related = [
    ...products.filter((p) => p.id !== product.id && p.category === product.category),
    ...products.filter((p) => p.id !== product.id && p.category !== product.category && p.kind === product.kind && p.image),
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
              <h1 className="font-display text-[40px] sm:text-[56px] font-bold leading-none">{product.name}</h1>
            </div>
            <span className={`flex items-center gap-2 text-sm ${product.inStock ? "text-leaf" : "text-sale"}`}>
              <span className={`w-[7px] h-[7px] rounded-full ${product.inStock ? "bg-leaf" : "bg-sale"}`} />
              {product.inStock ? "Available today" : "Sold out today"}
            </span>
          </div>
          {(product.description || product.notes) && <p className="text-lg leading-relaxed text-ink/85">{product.description || product.notes}</p>}

          <dl className="grid grid-cols-3 gap-4 border-y border-ink py-4">
            <Spec label="Menu" value={product.categoryName} />
            <Spec label={product.fromPrice === product.price ? "Price" : "From"} value={formatGHS(product.fromPrice)} />
            <Spec label="Branch" value={branch ? branch.name : "—"} />
          </dl>

          {/* Keyed so switching to another item starts from its own defaults. */}
          <ItemCustomizer key={product.id} product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 sm:mt-24">
          <h2 className="font-display text-2xl sm:text-[28px] font-normal">You might also like</h2>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </section>
      )}
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

function DetailSkeleton() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-6 pb-24" aria-busy="true" aria-label="Loading">
      <div className="h-5 w-40 rounded-full bg-tint animate-pulse" />
      <div className="mt-10 flex flex-wrap gap-10 lg:gap-20">
        <div className="flex-[1_1_420px] aspect-square rounded-[32px] bg-tint animate-pulse" />
        <div className="flex-[1_1_460px] flex flex-col gap-5">
          <div className="h-14 w-3/4 rounded-2xl bg-tint animate-pulse" />
          <div className="h-5 w-full rounded-full bg-tint animate-pulse" />
          <div className="h-5 w-2/3 rounded-full bg-tint animate-pulse" />
          <div className="h-12 w-full rounded-2xl bg-tint animate-pulse mt-6" />
        </div>
      </div>
    </div>
  );
}

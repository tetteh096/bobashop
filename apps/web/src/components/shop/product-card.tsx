"use client";

import React from "react";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import type { Product } from "@bobashop/api/data/catalog";
import { useCart } from "./cart-context";
import { ProductArt } from "./product-art";
import { formatGHS } from "./money";


/** True when the size (or another choice) changes the price, so the card says "from". */
export function priceVaries(product: Product) {
  return product.choices.some((c) => c.options.some((o) => o.priceChange !== c.options[0]!.priceChange));
}

/** An item on the menu: photo (or illustrated cup), name, one-line notes, price and a quick add. */
export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const saved = isInWishlist(product.id);
  const href = `/menu/${product.id}` as "/";
  const isFood = product.kind === "food";
  const photo = Boolean(product.image) && !isFood;

  return (
    <article
      className="group relative flex flex-col rounded-[26px] bg-card border border-line p-2 sm:p-2.5 transition-[border-color,box-shadow] duration-300 hover:border-brand/30 hover:shadow-[0_10px_24px_-18px_rgba(52,24,48,0.35)]"
    >
      <Link
        href={href}
        aria-label={`View ${product.name}`}
        className={`relative block rounded-[20px] overflow-hidden ${photo ? "aspect-[4/5]" : "aspect-[5/4]"}`}
        style={{ background: photo ? `${product.color}55` : `linear-gradient(160deg, ${product.color}66, ${product.color}26)` }}
      >
        {photo ? (
          <ProductArt
            product={product}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <>
            <span aria-hidden className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 w-[66%] aspect-square rounded-full bg-paper/45" />
            <ProductArt
              product={product}
              sizes="(min-width: 768px) 260px, 45vw"
              className={`absolute inset-0 m-auto transition-transform duration-500 group-hover:scale-[1.03] ${
                isFood ? "w-[82%] h-[82%]" : "h-[88%] w-auto"
              }`}
            />
          </>
        )}
      </Link>

      <button
        type="button"
        onClick={() => toggleWishlist(product)}
        aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
        aria-pressed={saved}
        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-paper/85 backdrop-blur flex items-center justify-center text-ink/70 hover:text-tomato cursor-pointer"
      >
        <Heart className={`w-[18px] h-[18px] ${saved ? "fill-tomato text-tomato" : ""}`} strokeWidth={1.75} />
      </button>

      <div className="flex-1 flex flex-col px-2 sm:px-3 pt-3.5 pb-1.5">
        <h3 className={`font-display font-semibold leading-tight ${compact ? "text-[17px]" : "text-[17px] sm:text-xl"}`}>
          <Link href={href} className="hover:text-brand">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-[13px] sm:text-sm leading-snug text-subtle line-clamp-2 min-h-[2.6em]">{product.notes}</p>

        <div className="mt-auto pt-3.5 flex items-center justify-between gap-2">
          <span className="font-display font-bold text-lg sm:text-xl text-brand whitespace-nowrap">
            {priceVaries(product) && <span className="font-sans text-xs font-medium text-subtle mr-1">from</span>}
            {formatGHS(product.fromPrice)}
          </span>
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            aria-label={product.inStock ? `Add ${product.name} to bag` : `${product.name} is sold out`}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gold text-ink hover:bg-brand-deep hover:text-gold disabled:bg-line disabled:text-subtle flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {!product.inStock && (
        <span className="pointer-events-none absolute inset-x-0 top-[30%] text-center">
          <span className="rounded-full bg-night text-cream text-xs px-3 py-1.5">Sold out today</span>
        </span>
      )}
    </article>
  );
}

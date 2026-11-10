"use client";

import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { m } from "motion/react";
import type { Product } from "@bobashop/api/data/catalog";
import { PlusButton } from "../arrow-button";
import { useCart } from "./cart-context";
import { ProductArt } from "./product-art";
import { formatGHS } from "./money";

/** A drink on the menu: cup, name, one-line notes, price and a "+" that adds it as it comes. */
export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const saved = isInWishlist(product.id);
  const href = `/menu/${product.id}` as "/";

  return (
    <m.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col items-center text-center border border-line hover:border-ink/50 transition-colors px-3 sm:px-5 pt-6 sm:pt-7 pb-3 sm:pb-5"
    >
      {product.badge && (
        <span className="absolute top-3 left-3 bg-tomato text-white text-[11px] sm:text-xs tracking-wide px-2 py-0.5">{product.badge}</span>
      )}
      <button
        type="button"
        onClick={() => toggleWishlist(product)}
        aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
        aria-pressed={saved}
        className="absolute top-1.5 right-1.5 w-11 h-11 flex items-center justify-center text-ink/60 hover:text-brand cursor-pointer"
      >
        <Heart className={`w-[18px] h-[18px] ${saved ? "fill-brand text-brand" : ""}`} strokeWidth={1.5} />
      </button>

      <Link href={href} aria-label={`View ${product.name}`} className="block w-[68%] sm:w-[72%] max-w-[190px]">
        <ProductArt product={product} className="w-full aspect-square transition-transform duration-500 group-hover:rotate-[8deg]" />
      </Link>

      <h3 className={`mt-4 sm:mt-5 font-display font-normal leading-tight ${compact ? "text-lg" : "text-lg sm:text-[22px]"}`}>
        <Link href={href} className="hover:text-brand">
          {product.name}
        </Link>
      </h3>
      <p className="mt-1.5 text-[13px] sm:text-sm leading-snug text-subtle line-clamp-2 min-h-[2.6em]">{product.notes}</p>

      <div className="mt-auto pt-4 w-full flex items-center justify-between gap-2">
        <span className="text-[14px] sm:text-base whitespace-nowrap">
          <span className="hidden sm:inline text-subtle">Regular / </span>
          <span className="font-medium">{formatGHS(product.price)}</span>
        </span>
        <PlusButton
          onClick={() => addToCart(product)}
          disabled={!product.inStock}
          label={product.inStock ? `Add ${product.name} to bag` : `${product.name} is sold out`}
        />
      </div>
      {!product.inStock && (
        <span className="pointer-events-none absolute inset-x-0 top-1/3 text-center">
          <span className="bg-night text-cream text-xs px-3 py-1.5">Sold out today</span>
        </span>
      )}
    </m.article>
  );
}

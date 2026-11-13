"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, X } from "lucide-react";
import { ArrowButton, Breadcrumb } from "@/components/arrow-button";
import { ProductCard } from "@/components/shop/product-card";
import { useCart } from "@/components/shop/cart-context";

export default function WishlistPage() {
  const { wishlist, addToCart, toggleWishlist, clearWishlist } = useCart();

  // Each goes in the way it comes; open a drink to change its sweetness or toppings.
  // Items priced by options are ordered on WhatsApp, so they can't go in the bag.
  const quickAdd = wishlist.filter((p) => p.inStock && !p.askPrice);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-5 pb-24">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Saved" }]} />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display font-bold text-[44px] sm:text-6xl leading-none text-brand-deep">Saved</h1>
          <p className="mt-2 text-subtle">
            {wishlist.length === 0
              ? "Your favourites, kept for next time."
              : `${wishlist.length} ${wishlist.length === 1 ? "item" : "items"} kept for next time.`}
          </p>
        </div>
        {wishlist.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={clearWishlist} className="min-h-11 px-4 text-[15px] text-subtle hover:text-tomato underline underline-offset-4 cursor-pointer">
              Clear all
            </button>
            {quickAdd.length > 0 && (
              <button
                type="button"
                onClick={() => quickAdd.forEach((product) => addToCart(product))}
                className="inline-flex items-center gap-2 min-h-12 px-6 rounded-full bg-brand-deep text-cream hover:bg-night font-medium cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" /> Add {quickAdd.length === wishlist.length ? "all" : quickAdd.length} to bag
              </button>
            )}
          </div>
        )}
      </div>
      {quickAdd.length > 0 && quickAdd.length < wishlist.length && (
        <p className="mt-3 text-sm text-subtle">Sold-out items, and food priced by your choice, stay here and aren&apos;t added.</p>
      )}

      {wishlist.length === 0 ? (
        <div className="mt-10 rounded-[32px] bg-card border border-line p-10 sm:p-16 text-center flex flex-col items-center">
          <span className="w-16 h-16 rounded-full bg-gold-soft flex items-center justify-center">
            <Heart className="w-7 h-7 text-tomato" />
          </span>
          <p className="mt-6 font-display text-3xl font-bold">Nothing saved yet</p>
          <p className="mt-2 text-subtle max-w-sm">Tap the heart on any drink or dish and it&apos;ll wait for you here.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ArrowButton href="/menu" tone="purple">
              See the drinks
            </ArrowButton>
            <Link href={"/menu?tab=food" as "/"} className="inline-flex items-center min-h-13 px-7 rounded-full border border-ink hover:bg-ink hover:text-paper font-medium transition-colors">
              See the food
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {wishlist.map((product) => (
            <div key={product.id} className="flex flex-col gap-2">
              <ProductCard product={product} />
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={`Remove ${product.name} from saved`}
                className="self-center inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full text-sm text-subtle hover:text-tomato hover:bg-tomato-soft/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

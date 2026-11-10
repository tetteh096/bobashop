"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { useCart } from "@/components/shop/cart-context";

export default function WishlistPage() {
  const { wishlist, addToCart } = useCart();

  // Each goes in the way it comes; open a drink to change its sweetness or toppings.
  const quickAdd = wishlist.filter((p) => p.inStock);

  return (
    <div className="bg-paper text-ink overflow-clip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
        <nav className="flex items-center gap-2 text-sm text-subtle">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span aria-hidden>/</span>
          <span className="text-ink font-medium">Saved</span>
        </nav>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-5xl sm:text-6xl font-light uppercase tracking-[0.02em]">Saved drinks</h1>
          {quickAdd.length > 0 && (
            <button
              type="button"
              onClick={() => quickAdd.forEach((product) => addToCart(product))}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-5 py-3 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" /> Add {quickAdd.length === wishlist.length ? "all" : quickAdd.length} to bag
            </button>
          )}
        </div>
        {quickAdd.length > 0 && quickAdd.length < wishlist.length && (
          <p className="mt-2 text-sm text-subtle">Drinks that are sold out today stay here for next time.</p>
        )}

        {wishlist.length === 0 ? (
          <div className="mt-10 bg-card border border-line p-10 sm:p-16 text-center">
            <div className="mx-auto w-16 h-16 bg-tint flex items-center justify-center">
              <Heart className="w-7 h-7 text-sale" />
            </div>
            <p className="mt-6 font-display text-2xl font-normal">Nothing saved yet</p>
            <p className="mt-2 text-subtle">Tap the heart on any drink to keep it here for next time.</p>
            <Link href="/menu" className="mt-8 inline-flex items-center gap-2 bg-brand text-white font-semibold px-6 py-3.5">
              See the menu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

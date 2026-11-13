"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Heart, Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { MAX_QUANTITY_PER_ITEM } from "@bobashop/api/pricing";
import { categoryName, describeOptions } from "@bobashop/api/data/catalog";
import { useCart } from "@/components/shop/cart-context";
import { OrderSummary } from "@/components/shop/order-summary";
import { FulfilmentChoice } from "@/components/shop/fulfilment-choice";
import { ProductArt } from "@/components/shop/product-art";
import { formatGHS } from "@/components/shop/money";

export default function CartPage() {
  const { items, totalItems, updateQuantity, removeFromCart, moveToWishlist, clearCart, fulfilment, setFulfilment } = useCart();

  return (
    <div className="bg-paper text-ink overflow-clip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
        <nav className="flex items-center gap-2 text-sm text-subtle">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span aria-hidden>/</span>
          <span className="text-ink font-medium">Bag</span>
        </nav>
        <h1 className="mt-3 font-display text-5xl sm:text-6xl font-light uppercase tracking-[0.02em]">
          Your bag{totalItems > 0 && <span className="text-brand"> ({totalItems})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="mt-10 bg-card border border-line p-10 sm:p-16 text-center">
            <div className="mx-auto w-16 h-16 bg-tint flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-brand" />
            </div>
            <p className="mt-6 font-display text-2xl font-normal">Nothing in here yet</p>
            <p className="mt-2 text-subtle">Pick something from the menu, or check what you saved.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/menu" className="inline-flex items-center gap-2 bg-brand text-white font-semibold px-6 py-3.5">
                See the menu <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={"/wishlist" as "/"} className="inline-flex items-center gap-2 border border-ink/20 bg-card font-semibold px-6 py-3.5">
                <Heart className="w-4 h-4" /> Saved
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-10 items-start">
            <div>
              <ul className="space-y-3">
                {items.map(({ key, product, options, unitPrice, quantity }) => (
                  <li key={key} className="p-4 sm:p-5 flex gap-4 sm:gap-5 bg-card border border-line">
                    <ProductArt product={product} className="w-20 h-20 sm:w-28 sm:h-28 shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-subtle">{categoryName(product.category)}</p>
                          <p className="mt-0.5 font-display text-base sm:text-lg font-normal leading-snug">{product.name}</p>
                          <p className="mt-0.5 text-sm text-subtle">{describeOptions(options, product)}</p>
                        </div>
                        <p className="font-display text-lg font-normal shrink-0">{formatGHS(unitPrice * quantity)}</p>
                      </div>
                      <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
                        <div className="flex items-center rounded-full border border-line">
                          <button type="button" onClick={() => updateQuantity(key, quantity - 1)} aria-label="Decrease quantity" className="p-2.5 cursor-pointer">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-7 text-center font-semibold">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(key, Math.min(MAX_QUANTITY_PER_ITEM, quantity + 1))}
                            aria-label="Increase quantity"
                            className="p-2.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="hidden sm:inline text-sm text-subtle">{formatGHS(unitPrice)} each</span>
                        <div className="ml-auto flex items-center gap-4 text-sm font-semibold">
                          <button type="button" onClick={() => moveToWishlist(key)} className="inline-flex items-center gap-1.5 hover:text-brand cursor-pointer">
                            <Heart className="w-4 h-4" /> <span className="hidden sm:inline">Save for later</span>
                          </button>
                          <button type="button" onClick={() => removeFromCart(key)} className="inline-flex items-center gap-1.5 hover:text-sale cursor-pointer">
                            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap justify-between gap-4">
                <Link href="/menu" className="inline-flex items-center gap-2 font-semibold hover:underline underline-offset-4">
                  ← Back to the menu
                </Link>
                <button type="button" onClick={clearCart} className="text-sm font-semibold text-subtle hover:text-sale cursor-pointer">
                  Empty bag
                </button>
              </div>
            </div>

            <div className="lg:sticky lg:top-32">
              <OrderSummary
                method={fulfilment}
                before={<FulfilmentChoice compact value={fulfilment} onChange={setFulfilment} />}
              >
                <Link
                  href={"/checkout" as "/"}
                  className="w-full inline-flex items-center justify-center gap-2 bg-tomato hover:bg-tomato-dark text-white font-semibold py-4 transition-colors"
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="mt-4 text-sm text-subtle flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Secure payment with Paystack: card or mobile money
                </p>
              </OrderSummary>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

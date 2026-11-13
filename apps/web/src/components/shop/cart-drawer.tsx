"use client";

import React from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { MAX_QUANTITY_PER_ITEM } from "@bobashop/api/pricing";
import { describeOptions } from "@bobashop/api/data/catalog";
import { useCart } from "./cart-context";
import { ProductArt } from "./product-art";
import { formatGHS } from "./money";

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    items,
    totalItems,
    removeFromCart,
    updateQuantity,
    subtotal,
    freeShippingThreshold,
    freeShippingRemaining,
  } = useCart();

  if (!isCartOpen) return null;

  const progress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const close = () => setIsCartOpen(false);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="absolute inset-0 bg-night/60 animate-in fade-in" onClick={close} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-paper shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="px-5 h-16 flex items-center justify-between border-b border-line bg-card">
            <h2 className="font-display text-xl font-normal flex items-center gap-2.5">
              Your bag
              <span className="text-xs font-semibold bg-brand text-white px-2 py-0.5">{totalItems}</span>
            </h2>
            <button type="button" onClick={close} aria-label="Close bag" className="p-2 rounded-full hover:bg-tint cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {items.length > 0 && (
            <div className="px-5 py-4 bg-card border-b border-line">
              <p className="text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand" />
                {freeShippingRemaining === 0 ? (
                  <span className="font-semibold">You&apos;ve got free delivery</span>
                ) : (
                  <span>
                    Add <strong>{formatGHS(freeShippingRemaining)}</strong> for free delivery
                  </span>
                )}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-tint overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-tint flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7 text-brand" />
                </div>
                <p className="mt-5 font-display text-xl font-normal">Your bag is empty</p>
                <p className="mt-1 text-sm text-subtle">Start with a best seller, or browse by tea.</p>
                <Link
                  href="/menu"
                  onClick={close}
                  className="mt-6 inline-flex items-center gap-2 bg-brand text-white font-semibold px-5 py-3"
                >
                  See the menu <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              items.map(({ key, product, options, unitPrice, quantity }) => (
                <div key={key} className="flex gap-3 p-3 bg-card border border-line">
                  <ProductArt product={product} className="w-16 h-16 shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                        <p className="text-xs text-subtle mt-0.5">
                          {describeOptions(options, product)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(key)}
                        aria-label={`Remove ${product.name}`}
                        className="p-1 text-subtle hover:text-sale cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-line">
                        <button type="button" onClick={() => updateQuantity(key, quantity - 1)} aria-label="Decrease quantity" className="p-2 cursor-pointer">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, Math.min(MAX_QUANTITY_PER_ITEM, quantity + 1))}
                          aria-label="Increase quantity"
                          className="p-2 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-semibold">{formatGHS(unitPrice * quantity)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-5 border-t border-line bg-card space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-subtle">Subtotal</span>
                <span className="font-display text-2xl font-normal">{formatGHS(subtotal)}</span>
              </div>
              <p className="text-xs text-subtle">Delivery is worked out at checkout. Pickup from the shop is free.</p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={"/cart" as "/"}
                  onClick={close}
                  className="text-center border border-ink/20 py-3 font-semibold hover:border-ink transition-colors"
                >
                  View bag
                </Link>
                <Link
                  href={"/checkout" as "/"}
                  onClick={close}
                  className="inline-flex items-center justify-center gap-2 bg-tomato hover:bg-tomato-dark text-white py-3 font-semibold transition-colors"
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

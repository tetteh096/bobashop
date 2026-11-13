"use client";

import React, { useState } from "react";
import { MessageCircle, Minus, Plus } from "lucide-react";
import type { Product } from "@bobashop/api/data/catalog";
import { useBranch } from "../branch";
import { useCart } from "./cart-context";
import { formatGHS } from "./money";
import { whatsappOrderLink } from "./product-card";

/** Food comes as listed: choose how many and add it. Items priced by options go to WhatsApp. */
export function FoodOrder({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { contact, branch } = useBranch();
  const [quantity, setQuantity] = useState(1);

  if (product.askPrice) {
    return (
      <div className="rounded-3xl bg-gold-soft p-6 flex flex-col gap-4">
        <p className="text-[17px] leading-relaxed">
          The price depends on the pieces or options you choose. Message {branch ? branch.name : "your branch"} and they&apos;ll tell you
          what&apos;s available today.
        </p>
        <a
          href={whatsappOrderLink(contact.whatsapp, product)}
          target="_blank"
          rel="noreferrer"
          className="self-start inline-flex items-center gap-2 min-h-13 px-7 rounded-full bg-brand-deep text-cream hover:bg-night font-medium"
        >
          <MessageCircle className="w-5 h-5" strokeWidth={2} /> Order on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="inline-flex items-center h-14 rounded-full border border-line bg-card">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label="One fewer"
          className="w-14 h-14 rounded-full flex items-center justify-center hover:text-brand cursor-pointer disabled:opacity-30"
          disabled={quantity <= 1}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(20, q + 1))}
          aria-label="One more"
          className="w-14 h-14 rounded-full flex items-center justify-center hover:text-brand cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => addToCart(product, { quantity })}
        disabled={!product.inStock}
        className="flex-1 min-w-[220px] min-h-14 rounded-full bg-tomato text-white hover:bg-tomato-dark disabled:bg-line font-medium cursor-pointer disabled:cursor-not-allowed"
      >
        {product.inStock ? `Add to bag · ${formatGHS(product.price * quantity)}` : "Sold out today"}
      </button>
    </div>
  );
}

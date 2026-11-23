"use client";

import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_QUANTITY_PER_ITEM } from "@bobashop/api/pricing";
import { defaultOptions, unitPrice, type ItemOptions, type Product } from "@bobashop/api/data/catalog";
import { useCart } from "./cart-context";
import { formatGHS } from "./money";

/**
 * The choices on an item's page: exactly the item's attributes in SmartSale (sizes, pieces…).
 * Priced with the same function the server charges with.
 */
export function ItemCustomizer({ product }: { product: Product }) {
  const { addToCart, setIsCartOpen } = useCart();
  const [options, setOptions] = useState<ItemOptions>(() => defaultOptions(product));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const update = (next: Partial<ItemOptions>) => {
    setOptions((o) => ({ ...o, ...next }));
    setAdded(false);
  };

  const price = unitPrice(product, options);
  const noun = product.kind === "drink" ? "cups" : "";

  const add = () => {
    addToCart(product, { options, quantity });
    setAdded(true);
  };

  return (
    <div className="space-y-7">
      {product.choices.map((choice) =>
        choice.options.length > 1 ? (
          <ChoiceGroup key={choice.name} label={choice.name}>
            {choice.options.map((o) => {
              const extra = o.priceChange - choice.options[0]!.priceChange;
              return (
                <Pill
                  key={o.value}
                  active={options.choices[choice.name] === o.value}
                  onClick={() => update({ choices: { ...options.choices, [choice.name]: o.value } })}
                >
                  {o.value}
                  {extra !== 0 && <span className="opacity-70"> {extra > 0 ? "+" : "−"}{formatGHS(Math.abs(extra))}</span>}
                </Pill>
              );
            })}
          </ChoiceGroup>
        ) : (
          <p key={choice.name} className="text-[15px]">
            <span className="font-medium">{choice.name}:</span> {choice.options[0]!.value}
          </p>
        )
      )}

      <div className="pt-2 flex items-baseline gap-3">
        <span className="font-display text-4xl font-normal">{formatGHS(price * quantity)}</span>
        {quantity > 1 && <span className="text-subtle">{formatGHS(price)} each</span>}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center border border-ink rounded-full">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label={`Fewer ${noun}`.trim()}
            className="w-12 h-12 flex items-center justify-center cursor-pointer"
          >
            <Minus className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <span className="w-8 text-center text-lg" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(product.stockLeft ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM, q + 1))}
            aria-label={`More ${noun}`.trim()}
            className="w-12 h-12 flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!product.inStock}
          className="flex-1 min-w-[220px] min-h-13 px-7 bg-tomato hover:bg-tomato-dark disabled:bg-line disabled:text-subtle text-white text-base transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {!product.inStock ? "Sold out today" : added ? "Added to your bag" : "Add to bag"}
        </button>
      </div>
      {product.stockLeft !== undefined && product.inStock && product.stockLeft <= 5 && (
        <p className="text-sm text-tomato-dark">Only {product.stockLeft} left today</p>
      )}
      {added && (
        <button type="button" onClick={() => setIsCartOpen(true)} className="text-sm text-tomato-dark underline underline-offset-4 hover:text-tomato cursor-pointer">
          View your bag
        </button>
      )}
    </div>
  );
}

function ChoiceGroup({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="flex flex-wrap items-baseline gap-x-3 text-[15px] font-medium pb-3">
        {label}
        {note && <span className="text-sm font-normal text-subtle">{note}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 px-4 border text-[15px] transition-colors cursor-pointer ${
        active ? "bg-ink border-ink text-paper" : "border-[#D9BF8E] hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

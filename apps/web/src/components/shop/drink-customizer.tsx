"use client";

import React, { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { MAX_QUANTITY_PER_ITEM } from "@bobashop/api/pricing";
import {
  defaultOptions,
  ICE,
  MAX_TOPPINGS,
  SIZES,
  SWEETNESS,
  TOPPINGS,
  unitPrice,
  type DrinkOptions,
  type Product,
  type ToppingId,
} from "@bobashop/api/data/catalog";
import { useCart } from "./cart-context";
import { formatGHS } from "./money";

/** The choices on a drink's page. Everything is priced with the same function the server uses. */
export function DrinkCustomizer({ product }: { product: Product }) {
  const { addToCart, setIsCartOpen } = useCart();
  const [options, setOptions] = useState<DrinkOptions>(() => defaultOptions(product));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const set = <K extends keyof DrinkOptions>(key: K, value: DrinkOptions[K]) => {
    setOptions((o) => ({ ...o, [key]: value }));
    setAdded(false);
  };

  const included = product.included ?? [];
  const extras = options.toppings.filter((t) => !included.includes(t));
  const toggleTopping = (id: ToppingId) => {
    const on = options.toppings.includes(id);
    if (!on && !included.includes(id) && extras.length >= MAX_TOPPINGS) return;
    set("toppings", on ? options.toppings.filter((t) => t !== id) : [...options.toppings, id]);
  };

  const price = unitPrice(product, options);
  const iceChoices = product.canBeHot ? ICE : ICE.filter((i) => i.id !== "hot");

  const add = () => {
    addToCart(product, { options, quantity });
    setAdded(true);
  };

  return (
    <div className="space-y-7">
      <ChoiceGroup label="Size">
        {SIZES.map((s) => (
          <Pill key={s.id} active={options.size === s.id} onClick={() => set("size", s.id)}>
            {s.name}
            {s.extra > 0 && <span className="opacity-70"> +{formatGHS(s.extra)}</span>}
          </Pill>
        ))}
      </ChoiceGroup>

      <ChoiceGroup label="Sweetness">
        {SWEETNESS.map((s) => (
          <Pill key={s.id} active={options.sweetness === s.id} onClick={() => set("sweetness", s.id)}>
            {s.name}
          </Pill>
        ))}
      </ChoiceGroup>

      <ChoiceGroup label="Ice" note={product.canBeHot ? undefined : "Served cold only"}>
        {iceChoices.map((i) => (
          <Pill key={i.id} active={options.ice === i.id} onClick={() => set("ice", i.id)}>
            {i.name}
          </Pill>
        ))}
      </ChoiceGroup>

      <fieldset>
        <legend className="flex flex-wrap items-baseline gap-x-3 text-[15px] font-medium pb-3">
          Toppings
          <span className="text-sm font-normal text-subtle">Up to {MAX_TOPPINGS} extra</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {TOPPINGS.map((t) => {
            const on = options.toppings.includes(t.id);
            const free = included.includes(t.id);
            const blocked = !on && !free && extras.length >= MAX_TOPPINGS;
            return (
              <button
                key={t.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={blocked}
                onClick={() => toggleTopping(t.id)}
                className="flex items-center gap-3 min-h-11 py-1.5 text-left text-[15px] disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
              >
                <span
                  className={`w-5 h-5 border flex items-center justify-center shrink-0 ${on ? "bg-brand border-brand text-cream" : "border-brand"}`}
                >
                  {on && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                </span>
                <span className="flex-1">{t.name}</span>
                <span className="text-sm text-subtle">{free ? "included" : `+${formatGHS(t.price)}`}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="pt-2 flex items-baseline gap-3">
        <span className="font-display text-4xl font-normal">{formatGHS(price * quantity)}</span>
        {quantity > 1 && <span className="text-subtle">{formatGHS(price)} each</span>}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center border border-ink rounded-full">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Fewer cups"
            className="w-12 h-12 flex items-center justify-center cursor-pointer"
          >
            <Minus className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <span className="w-8 text-center text-lg" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY_PER_ITEM, q + 1))}
            aria-label="More cups"
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

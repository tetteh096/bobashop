"use client";

import React from "react";
import { Check, Store, Truck } from "lucide-react";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, type FulfilmentMethod } from "@bobashop/api/pricing";
import { PICKUP_POINTS } from "@bobashop/api/data/shop";
import { formatGHS } from "./money";

const OPTIONS: { id: FulfilmentMethod; icon: typeof Truck; title: string; short: string; text: string }[] = [
  {
    id: "delivery",
    icon: Truck,
    title: "Deliver to me",
    short: "Delivery",
    text: `${formatGHS(DELIVERY_FEE)}, free over ${formatGHS(FREE_DELIVERY_THRESHOLD)}. Sealed so nothing spills.`,
  },
  {
    id: "pickup",
    icon: Store,
    title: PICKUP_POINTS.length === 1 ? "Pick up at the tea bar" : "Pick up at a tea bar",
    short: "Pickup",
    text: "Free. Made fresh and ready in about 15 minutes.",
  },
];

/** Delivery or pickup, as two large cards (checkout) or a compact switch (bag summary). */
export function FulfilmentChoice({
  value,
  onChange,
  compact = false,
}: {
  value: FulfilmentMethod;
  onChange: (method: FulfilmentMethod) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div role="radiogroup" aria-label="Delivery or pickup" className="grid grid-cols-2 gap-1 bg-tint p-1">
        {OPTIONS.map(({ id, icon: Icon, short }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            onClick={() => onChange(id)}
            className={`inline-flex items-center justify-center gap-2  py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              value === id ? "bg-card text-ink shadow-sm" : "text-ink/60 hover:text-ink"
            }`}
          >
            <Icon className="w-4 h-4" /> {short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Delivery or pickup" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {OPTIONS.map(({ id, icon: Icon, title, text }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={`relative text-left  border-2 p-5 sm:p-6 flex sm:flex-col gap-4 transition-colors cursor-pointer ${
              active ? "border-brand bg-tint" : "border-line bg-card hover:border-ink/40"
            }`}
          >
            <span className={`w-12 h-12  flex items-center justify-center shrink-0 ${active ? "bg-brand text-butter" : "bg-tint text-ink"}`}>
              <Icon className="w-6 h-6" />
            </span>
            <span className="pr-8 sm:pr-0">
              <span className="block font-display text-xl font-normal">{title}</span>
              <span className="block text-sm text-subtle mt-1">{text}</span>
            </span>
            <span
              aria-hidden
              className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                active ? "border-brand bg-brand text-white" : "border-line"
              }`}
            >
              {active && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

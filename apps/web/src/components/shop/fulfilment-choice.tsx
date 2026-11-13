"use client";

import React from "react";
import { Check, Store, Truck } from "lucide-react";
import { FREE_DELIVERY_THRESHOLD, type FulfilmentMethod } from "@bobashop/api/pricing";
import { SHOP } from "@bobashop/api/data/shop";
import { lowestDeliveryFee } from "@bobashop/api/branch-menu";
import { useBranch } from "../branch";
import { formatGHS } from "./money";

/** Delivery or pickup at the chosen branch, as two large cards (checkout) or a compact switch (bag). */
export function FulfilmentChoice({
  value,
  onChange,
  compact = false,
}: {
  value: FulfilmentMethod;
  onChange: (method: FulfilmentMethod) => void;
  compact?: boolean;
}) {
  const { branch } = useBranch();
  const deliveryOff = Boolean(branch && !branch.delivery.enabled);
  const from = lowestDeliveryFee(branch);

  const options: { id: FulfilmentMethod; icon: typeof Truck; title: string; short: string; text: string; disabled?: boolean }[] = [
    {
      id: "delivery",
      icon: Truck,
      title: branch ? `Deliver from ${branch.name}` : "Deliver to me",
      short: "Delivery",
      text: deliveryOff
        ? `${branch!.name} is pickup only.`
        : `${from !== null ? `From ${formatGHS(from)}, ` : ""}by distance${branch ? ` (up to ${branch.delivery.maxKm} km)` : ""}. Free over ${formatGHS(FREE_DELIVERY_THRESHOLD)}.`,
      disabled: deliveryOff,
    },
    {
      id: "pickup",
      icon: Store,
      title: branch ? `Pick up at ${branch.name}` : "Pick up at your branch",
      short: "Pickup",
      text: `Free. Made fresh and ready in about ${SHOP.pickupMinutes} minutes.`,
    },
  ];

  if (compact) {
    return (
      <div role="radiogroup" aria-label="Delivery or pickup" className="grid grid-cols-2 gap-1 rounded-full bg-tint p-1">
        {options.map(({ id, icon: Icon, short, disabled }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
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
      {options.map(({ id, icon: Icon, title, text, disabled }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`relative text-left rounded-[22px] border-2 p-5 sm:p-6 flex sm:flex-col gap-4 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              active ? "border-brand bg-gold-soft" : "border-line bg-card hover:border-ink/40"
            }`}
          >
            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${active ? "bg-brand text-cream" : "bg-tint text-ink"}`}>
              <Icon className="w-6 h-6" />
            </span>
            <span className="pr-8 sm:pr-0">
              <span className="block font-display text-xl font-semibold">{title}</span>
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

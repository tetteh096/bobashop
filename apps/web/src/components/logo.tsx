import React from "react";
import { SHOP } from "@bobashop/api/data/shop";

/** Placeholder wordmark until the business sends its own logo. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" aria-hidden className="w-8 h-8 shrink-0">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.2" className={inverted ? "text-cream/70" : "text-ink/70"} />
        <circle cx="12" cy="19" r="3.2" className={inverted ? "fill-cream" : "fill-ink"} />
        <circle cx="19.5" cy="20.5" r="2.6" className={inverted ? "fill-cream" : "fill-ink"} />
        <circle cx="17.5" cy="12" r="2.2" className="fill-gold" />
      </svg>
      <span
        className={`font-display text-[20px] sm:text-[22px] font-normal uppercase tracking-[0.1em] leading-none ${
          inverted ? "text-cream" : "text-ink"
        }`}
      >
        {SHOP.name}
      </span>
    </span>
  );
}

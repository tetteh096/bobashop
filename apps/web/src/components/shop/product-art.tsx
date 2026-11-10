import React from "react";
import type { Product } from "@bobashop/api/data/catalog";

// Fixed pearl positions so every cup looks the same on the server and in the browser.
const PEARLS: [number, number, number][] = [
  [70, 122, 10],
  [94, 140, 10],
  [120, 134, 10],
  [140, 112, 9],
  [84, 100, 9],
  [110, 110, 9],
  [130, 154, 8],
  [64, 148, 8],
  [152, 138, 8],
];

/** A boba cup seen from above: lid rim, tea, pearls and the straw. Stands in for a photo. */
export function Cup({ color, label, className = "" }: { color: string; label?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="100" cy="100" r="96" fill="#F7F2E8" stroke="#6B3A26" strokeWidth="5" />
      <circle cx="100" cy="100" r="80" fill={color} />
      <circle cx="100" cy="100" r="75" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="10" />
      {PEARLS.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#1E140F" />
      ))}
      {PEARLS.slice(0, 3).map(([cx, cy]) => (
        <circle key={`h-${cx}-${cy}`} cx={cx - 3} cy={cy - 3} r="3" fill="#fff" fillOpacity="0.35" />
      ))}
      <path d="M46 84 A58 58 0 0 1 92 44" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="6" strokeLinecap="round" />
      <circle cx="136" cy="66" r="13" fill="#18211C" />
      <circle cx="136" cy="66" r="6" fill="#3A4A40" />
    </svg>
  );
}

/**
 * The drink's top-down photo when there is one; otherwise the illustrated cup in the
 * drink's colour, so the menu looks deliberate before real photos exist.
 */
export function ProductArt({
  product,
  className = "",
  priority = false,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
}) {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt={product.name}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`object-cover rounded-full ${className}`}
      />
    );
  }
  return <Cup color={product.color} label={product.name} className={className} />;
}

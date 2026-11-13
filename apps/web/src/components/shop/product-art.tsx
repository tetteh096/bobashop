import React from "react";
import Image from "next/image";
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
 * A boba cup from the side: dome lid, straw, the drink in its colour and pearls at the bottom.
 * `id` keeps the clip path unique when several cups are on one page.
 */
export function SideCup({ id, color, label, className = "" }: { id: string; color: string; label?: string; className?: string }) {
  const clip = `cup-clip-${id}`;
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <clipPath id={clip}>
          <path d="M44 52h72l-8.5 92a8 8 0 0 1-8 7.3H60.5a8 8 0 0 1-8-7.3z" />
        </clipPath>
      </defs>
      {/* straw */}
      <path d="M86 50L100 6" stroke="#341830" strokeWidth="9" strokeLinecap="round" />
      <path d="M86 50L100 6" stroke="#FBAD1C" strokeWidth="5" strokeLinecap="round" />
      {/* cup and drink */}
      <g clipPath={`url(#${clip})`}>
        <rect x="40" y="50" width="80" height="104" fill="#FFF7E8" />
        <rect x="40" y="62" width="80" height="92" fill={color} />
        <path d="M40 78c14-8 26 6 40-2s28-6 40 0v-16H40z" fill="#fff" fillOpacity="0.35" />
        <g fill="#2A1426">
          <circle cx="58" cy="140" r="6.5" />
          <circle cx="72" cy="143" r="6.5" />
          <circle cx="86" cy="141" r="6.5" />
          <circle cx="100" cy="139" r="6.5" />
          <circle cx="64" cy="129" r="6.5" />
          <circle cx="79" cy="131" r="6.5" />
          <circle cx="94" cy="128" r="6.5" />
          <circle cx="106" cy="127" r="5.5" />
          <circle cx="54" cy="127" r="5.5" />
        </g>
        <rect x="52" y="58" width="7" height="88" rx="3.5" fill="#fff" fillOpacity="0.3" />
      </g>
      <path d="M44 52h72l-8.5 92a8 8 0 0 1-8 7.3H60.5a8 8 0 0 1-8-7.3z" fill="none" stroke="#341830" strokeOpacity="0.15" strokeWidth="2" />
      {/* dome lid */}
      <path d="M46 50c2-20 16-30 34-30s32 10 34 30z" fill="#fff" fillOpacity="0.7" stroke="#341830" strokeOpacity="0.15" strokeWidth="2" />
      <rect x="38" y="47" width="84" height="9" rx="4.5" fill="#FFF7E8" stroke="#341830" strokeOpacity="0.2" strokeWidth="2" />
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
  sizes = "120px",
}: {
  product: Product;
  className?: string;
  priority?: boolean;
  /** How wide it shows, so phones download a small copy (see next/image `sizes`). */
  sizes?: string;
}) {
  if (product.image) {
    // Food photos are cut-outs on white: multiply drops the white into whatever tile is behind.
    const fit = product.kind === "food" ? "object-contain mix-blend-multiply" : "object-cover";
    return (
      <Image
        src={product.image}
        alt={product.name}
        width={600}
        height={800}
        sizes={sizes}
        priority={priority}
        className={`${fit} ${className}`}
      />
    );
  }
  return <SideCup id={product.id} color={product.color} label={product.name} className={className} />;
}

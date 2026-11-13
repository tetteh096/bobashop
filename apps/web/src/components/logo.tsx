import React from "react";
import Image from "next/image";
import { SHOP } from "@bobashop/api/data/shop";

/**
 * The Bobalicious logo. Its cup and ring are see-through, so on dark backgrounds (`inverted`)
 * it sits on a cream badge to keep the brown lettering readable.
 */
export function Logo({ inverted = false, className = "" }: { inverted?: boolean; className?: string }) {
  const img = (
    <Image
      src="/images/logo-sm.png"
      alt={SHOP.name}
      width={360}
      height={260}
      priority={!inverted}
      className={`w-auto ${inverted ? "h-14 sm:h-16" : "h-14 lg:h-16"} ${className}`}
    />
  );
  if (!inverted) return img;
  return <span className="inline-flex rounded-2xl bg-cream px-3 py-2">{img}</span>;
}

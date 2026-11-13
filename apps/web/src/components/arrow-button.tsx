import React from "react";
import Link from "next/link";
import { cn } from "@bobashop/ui/lib/utils";

type Tone = "outline" | "butter" | "brand" | "sugar" | "ghost-light" | "purple" | "mango";

const TONES: Record<Tone, string> = {
  brand: "bg-tomato text-white hover:bg-tomato-dark",
  sugar: "bg-brand text-cream hover:bg-brand-dark",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  butter: "bg-paper text-ink hover:bg-card",
  "ghost-light": "border border-cream/60 text-cream hover:bg-cream hover:text-ink",
  purple: "bg-brand-deep text-cream hover:bg-night",
  mango: "bg-gold text-ink hover:bg-[#f39c0a]",
};

/** The long thin arrow used on every call to action. */
export function LongArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={cn("w-[22px] h-3 shrink-0", className)}>
      <path d="M0 6h20M15 1l5 5-5 5" />
    </svg>
  );
}

/** Square button with a label and a long arrow that nudges on hover. */
export function ArrowButton({
  href,
  onClick,
  tone = "brand",
  children,
  className = "",
  external = false,
  type = "button",
  arrow = true,
}: {
  href?: string;
  onClick?: () => void;
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  type?: "button" | "submit";
  arrow?: boolean;
}) {
  // Merged so a caller's "hidden" or spacing wins over the defaults.
  const classes = cn(
    "group inline-flex items-center justify-center gap-3.5 min-h-13 px-7 py-3.5 rounded-full text-base font-medium transition-colors cursor-pointer",
    TONES[tone],
    className
  );
  const inner = (
    <>
      <span className="whitespace-nowrap">{children}</span>
      {arrow && <LongArrow className="transition-transform group-hover:translate-x-1" />}
    </>
  );

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href as "/"} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}

/** Thin outlined pill, used above headings. */
export function Eyebrow({ children, tone = "dark", icon }: { children: React.ReactNode; tone?: "dark" | "light"; icon?: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-display text-[15px] font-light lowercase ${
        tone === "light" ? "border-cream/50 text-cream" : "border-ink/40 text-ink"
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

/** Small "/"-separated trail at the top of inner pages. */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2.5 text-sm text-subtle">
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <LongArrow className="w-4 h-2.5" />}
          {item.href ? (
            <Link href={item.href as "/"} className="hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-ink">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/** Round clay "+" used on every drink card. */
export function PlusButton({ onClick, label, disabled, className = "" }: { onClick: () => void; label: string; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "w-11 h-11 rounded-full bg-tomato hover:bg-tomato-dark disabled:bg-line text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed",
        className
      )}
    >
      <svg viewBox="0 0 18 18" aria-hidden className="w-[18px] h-[18px]">
        <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </button>
  );
}

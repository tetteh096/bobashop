"use client";

import React from "react";
import { m, type Variants } from "motion/react";

// `m` components only work inside the <LazyMotion> set up in Providers, which keeps
// the animation code out of the first page load.

const EASE = [0.22, 1, 0.36, 1] as const;

// Small and quick, so scrolling on a phone never waits for content to appear.
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

// Start a little before the element reaches the screen, not after it's already on it.
const VIEWPORT = { once: true, margin: "0px 0px 120px 0px" } as const;

/** Fades its content up the first time it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </m.div>
  );
}

/** A grid or list whose <RevealItem> children animate in one after another. */
export function RevealGroup({
  children,
  className,
  as = "div",
  stagger = 0.04,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul";
  stagger?: number;
}) {
  const Component = as === "ul" ? m.ul : m.div;
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Component>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Component = as === "li" ? m.li : m.div;
  return (
    <Component className={className} variants={fadeUp}>
      {children}
    </Component>
  );
}

/** A <section> that fades up the first time it scrolls into view. */
export function RevealSection({
  children,
  ...props
}: React.ComponentProps<"section">) {
  const { onAnimationStart, onDrag, onDragStart, onDragEnd, ...rest } = props;
  return (
    <m.section
      {...rest}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={fadeUp}
    >
      {children}
    </m.section>
  );
}

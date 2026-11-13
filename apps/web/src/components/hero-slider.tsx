"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { ArrowButton } from "@/components/arrow-button";
import { useBranch } from "@/components/branch";

const SLIDE_MS = 6500;
const EASE = [0.22, 1, 0.36, 1] as const;

type Slide = {
  id: string;
  tab: string;
  image: string;
  alt: string;
  /** Where the subject sits, so the crop keeps it in view on narrow screens. */
  focus: string;
  kicker: string;
  title: React.ReactNode;
  text: string;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    id: "boba",
    tab: "Boba",
    image: "/images/hero-brown-sugar.jpg",
    alt: "A Bobalicious brown sugar milk tea with pearls, brown sugar cubes and ice",
    focus: "82% center",
    kicker: "Milk tea · Matcha · Fruit tea",
    title: (
      <>
        Sip something
        <br />
        <span className="text-gold">bobalicious.</span>
      </>
    ),
    text: "Milk teas loaded with Biscoff, Oreo, Kit Kat and popping pearls. Your sweetness, your ice, your way.",
    accent: "bg-gold",
  },
  {
    id: "pizza",
    tab: "Pizza",
    image: "/images/hero-pizza.jpg",
    alt: "Two cheesy pizzas with peppers and rocket on a dark wooden table",
    focus: "70% center",
    kicker: "Hot from the oven",
    title: (
      <>
        POV: you deserve
        <br />
        <span className="text-gold">this pizza.</span>
      </>
    ),
    text: "Cheesy, loaded and made to share. Treat yourself, then add a milk tea on the side.",
    accent: "bg-tomato",
  },
  {
    id: "food",
    tab: "Food",
    image: "/images/hero-food.jpg",
    alt: "Shawarma wraps with pickles and fries on a wooden board",
    focus: "65% center",
    kicker: "Wings · Shawarma · Jollof",
    title: (
      <>
        Hungry?
        <br />
        <span className="text-gold">We&apos;ve got you.</span>
      </>
    ),
    text: "Crispy wings in four flavours, loaded shawarma and assorted jollof. Add it to your boba order.",
    accent: "bg-brand",
  },
];

export function HeroSlider() {
  const { branch, openPicker, contact } = useBranch();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((next: number) => setIndex((next + SLIDES.length) % SLIDES.length), []);

  // Autoplay. Restarts the timer whenever the slide changes, so a manual pick gets its full time.
  useEffect(() => {
    if (paused || reduceMotion) return;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduceMotion, go]);

  const slide = SLIDES[index]!;
  const isDrink = slide.id === "boba";
  const whatsapp = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    `Hi Bobalicious, I'd like to order some ${slide.id === "pizza" ? "pizza" : "food"}.`
  )}`;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What's on at Bobalicious"
      className="relative isolate overflow-hidden bg-night text-cream h-[min(76svh,620px)] min-h-[480px] sm:h-[calc(100svh-68px)] sm:min-h-[560px] sm:max-h-[860px] lg:h-[calc(100svh-80px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start == null || end == null || Math.abs(end - start) < 50) return;
        go(index + (end < start ? 1 : -1));
      }}
    >
      <h1 className="sr-only">Bobalicious Gh: boba, pizza and food in Accra</h1>

      {/* Photos: all three are in the page from the start (the first one first), so a slide
          never waits on its photo; they cross-fade, with a slow push-in on the one showing. */}
      {SLIDES.map((s, i) => {
        const active = i === index;
        return (
          <m.div
            key={s.id}
            aria-hidden={!active}
            className="absolute inset-0 -z-10"
            initial={false}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <m.div
              className="absolute inset-0"
              initial={false}
              animate={{ scale: active ? 1 : 1.1 }}
              transition={active ? { duration: SLIDE_MS / 1000 + 1.5, ease: "linear" } : { duration: 0, delay: 1 }}
            >
              <Image
                src={s.image}
                alt={active ? s.alt : ""}
                fill
                priority={i === 0}
                loading={i === 0 ? undefined : "eager"}
                fetchPriority={i === 0 ? "high" : "low"}
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: s.focus }}
              />
            </m.div>
          </m.div>
        );
      })}
      {/* Keeps the words readable: from below on phones (photo on top), from the left on wider screens */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/75 to-night/10 sm:bg-gradient-to-r sm:from-night/90 sm:via-night/55 sm:to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-48 -z-10 bg-gradient-to-t from-night/90 to-transparent" />

      <div className="relative h-full max-w-[1280px] mx-auto px-4 sm:px-8 flex flex-col justify-end sm:justify-center pb-24 sm:pb-24">
        {/* initial={false}: the first slide is readable before scripts load; later slides animate in */}
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${SLIDES.length}: ${slide.tab}`}
            className="max-w-[640px] flex flex-col gap-4 sm:gap-6"
            initial="hidden"
            animate="show"
            exit="exit"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
              exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
            }}
          >
            <m.p variants={rise} className="inline-flex items-center gap-3 text-sm sm:text-[15px] font-medium tracking-[0.08em] uppercase text-cream/80">
              <span className={`w-8 h-[3px] rounded-full ${slide.accent}`} />
              {slide.kicker}
            </m.p>
            <m.h2 variants={rise} className="font-display font-bold leading-[0.98] tracking-[-0.015em] text-[38px] sm:text-[68px] lg:text-[84px]">
              {slide.title}
            </m.h2>
            <m.p variants={rise} className="text-base sm:text-xl leading-snug text-cream/85 max-w-[520px]">
              {slide.text}
            </m.p>
            <m.div variants={rise} className="flex flex-wrap gap-3 pt-1">
              {isDrink ? (
                <ArrowButton href="/menu" tone="mango">
                  Order boba
                </ArrowButton>
              ) : slide.id === "food" ? (
                <ArrowButton href="/menu?tab=food" tone="mango">
                  See the food menu
                </ArrowButton>
              ) : (
                <ArrowButton href={whatsapp} external tone="mango">
                  Order on WhatsApp
                </ArrowButton>
              )}
              <ArrowButton onClick={openPicker} tone="ghost-light" arrow={false}>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" strokeWidth={2} />
                  {branch ? `${branch.name}` : "Choose your branch"}
                </span>
              </ArrowButton>
            </m.div>
          </m.div>
        </AnimatePresence>
      </div>

      {/* Controls: tabs with progress, arrows */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pb-6 sm:pb-8 flex items-end gap-4">
          <div role="tablist" aria-label="Choose a slide" className="flex-1 grid grid-cols-3 gap-3 sm:gap-5 max-w-[560px]">
            {SLIDES.map((s, i) => {
              const active = i === index;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Show ${s.tab}`}
                  onClick={() => go(i)}
                  className="group text-left cursor-pointer pt-3"
                >
                  <span className="block h-[3px] rounded-full bg-cream/25 overflow-hidden">
                    {active ? (
                      <m.span
                        key={`${s.id}-${paused || reduceMotion ? "still" : "run"}`}
                        className="block h-full bg-gold origin-left"
                        initial={{ scaleX: paused || reduceMotion ? 1 : 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: paused || reduceMotion ? 0 : SLIDE_MS / 1000, ease: "linear" }}
                      />
                    ) : (
                      <span className={`block h-full ${i < index ? "bg-cream/60" : ""}`} />
                    )}
                  </span>
                  <span className={`mt-2.5 flex items-baseline gap-2 text-sm sm:text-base transition-colors ${active ? "text-cream" : "text-cream/55 group-hover:text-cream/85"}`}>
                    <span className="font-display font-semibold tabular-nums">0{i + 1}</span>
                    <span className="font-medium">{s.tab}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="hidden sm:flex gap-2 ml-auto">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="w-12 h-12 rounded-full border border-cream/35 hover:bg-cream hover:text-ink flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="w-12 h-12 rounded-full border border-cream/35 hover:bg-cream hover:text-ink flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const rise = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

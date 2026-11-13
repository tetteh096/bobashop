"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

type Review = { quote: string; name: string; detail: string; rating: number };

/**
 * SAMPLE REVIEWS: placeholders to design the section with. Replace them with real reviews
 * (with each customer's permission), then set REVIEWS_ARE_REAL to true. Until then the
 * section only shows in development, so made-up reviews never reach the live site.
 */
const REVIEWS_ARE_REAL = false;

const REVIEWS: Review[] = [
  { quote: "The Dirty Tiger is my weekly treat. Brown sugar stripes, chocolate crumbles, perfect pearls.", name: "Sample customer", detail: "East Legon", rating: 5 },
  { quote: "Ordered on my way from lectures and it was ready when I got there. Taro milk tea all day.", name: "Sample customer", detail: "UG Pent Hall", rating: 5 },
  { quote: "Pizza and a Kit Kat milk tea for movie night. Delivery was quick and everything was still cold or hot.", name: "Sample customer", detail: "North Kaneshie", rating: 5 },
  { quote: "Mangolicious fruit tea on a hot afternoon. Nothing else comes close.", name: "Sample customer", detail: "Adenta", rating: 5 },
  { quote: "Staff are friendly and the Biscoff latte is unreal. My friends and I come here every Friday.", name: "Sample customer", detail: "UPSA", rating: 5 },
];

export function Testimonials() {
  const track = useRef<HTMLDivElement>(null);
  if (!REVIEWS_ARE_REAL && process.env.NODE_ENV === "production") return null;

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("article");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 320) + 20), behavior: "smooth" });
  };

  return (
    <section className="bg-night text-cream">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-20 sm:py-24 flex flex-col gap-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Reviews</p>
            <h2 className="font-display font-bold text-[40px] sm:text-6xl leading-none">What our customers say</h2>
            {!REVIEWS_ARE_REAL && (
              <p className="text-sm text-tomato bg-tomato/10 rounded-full px-3 py-1 self-start">
                Sample reviews: only visible in development until real ones are added
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => scroll(-1)} aria-label="Previous reviews" className="w-12 h-12 rounded-full border border-cream/35 hover:bg-cream hover:text-ink flex items-center justify-center cursor-pointer transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="Next reviews" className="w-12 h-12 rounded-full border border-cream/35 hover:bg-cream hover:text-ink flex items-center justify-center cursor-pointer transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </Reveal>

        <div
          ref={track}
          className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {REVIEWS.map((r, i) => (
            <article
              key={i}
              className="snap-start shrink-0 w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] rounded-3xl bg-cream/[0.06] border border-cream/10 p-6 sm:p-7 flex flex-col gap-5"
            >
              <div className="flex gap-1" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, k) => (
                  <Star key={k} className={`w-4 h-4 ${k < r.rating ? "fill-gold text-gold" : "text-cream/30"}`} />
                ))}
              </div>
              <blockquote className="text-[17px] leading-relaxed text-cream/90 flex-1">&ldquo;{r.quote}&rdquo;</blockquote>
              <footer className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-gold text-ink font-display font-bold flex items-center justify-center">
                  {r.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span>
                  <span className="block font-semibold">{r.name}</span>
                  <span className="block text-sm text-cream/60">{r.detail}</span>
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

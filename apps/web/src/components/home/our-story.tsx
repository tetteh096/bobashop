import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { BRANCHES, SHOP } from "@bobashop/api/data/shop";
import { ArrowButton, LongArrow } from "@/components/arrow-button";
import { Reveal } from "@/components/motion/reveal";

/** From the Bobalicious Gh listing on Bolt Food (Nov 2026). Update it if it changes. */
const BOLT_RATING = 4.6;

const STATS = [
  { value: "700", unit: "ml", label: "large cups" },
  { value: String(BRANCHES.length), label: "branches in Accra" },
  { value: `${SHOP.pickupMinutes}`, unit: "min", label: "average pickup" },
];

const PERKS = ["Made fresh to order", "Wings, shawarma and more", "Pickup or delivery", "MoMo, card or transfer"];

export function OurStory() {
  return (
    <section className="relative overflow-hidden">
      <span aria-hidden className="absolute -right-40 top-10 w-[520px] aspect-square rounded-full bg-gold-soft/70 -z-10" />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Collage */}
        <Reveal className="relative h-[460px] sm:h-[580px] max-w-[600px] w-full mx-auto lg:mx-0">
          <span aria-hidden className="absolute -left-8 bottom-4 w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gold" />
          <span aria-hidden className="absolute left-[46%] -top-4 w-16 h-16 rounded-full bg-tomato/90" />

          <div className="absolute left-0 top-0 w-[76%] h-[84%] rounded-[36px] overflow-hidden shadow-[0_30px_60px_-30px_rgba(35,15,32,0.55)]">
            <Image
              src="/images/story-oreo.jpg"
              alt="Two Bobalicious cookies and cream milk teas with pearls and a milk splash"
              fill
              sizes="(min-width: 1024px) 460px, 76vw"
              className="object-cover object-[40%_center]"
            />
          </div>

          <div className="absolute right-0 bottom-0 w-[46%] aspect-[4/5] rounded-[28px] overflow-hidden border-[6px] border-paper rotate-[4deg] shadow-[0_24px_50px_-24px_rgba(35,15,32,0.6)]">
            <Image
              src="/images/story-drinks.jpg"
              alt="An iced matcha latte and a brown sugar milk tea on a dark tray"
              fill
              sizes="(min-width: 1024px) 280px, 46vw"
              className="object-cover object-[42%_center]"
            />
          </div>

          {/* Rating card */}
          <div className="absolute left-4 sm:left-6 bottom-[6%] rounded-2xl bg-paper shadow-[0_18px_40px_-18px_rgba(35,15,32,0.5)] px-4 py-3.5 flex items-center gap-3.5">
            <span className="font-display text-4xl font-bold text-brand-deep leading-none">{BOLT_RATING}</span>
            <span className="flex flex-col gap-1">
              <span className="flex gap-0.5" aria-label={`${BOLT_RATING} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, k) => (
                  <Star key={k} className={`w-3.5 h-3.5 ${k < Math.round(BOLT_RATING) ? "fill-gold text-gold" : "text-line"}`} />
                ))}
              </span>
              <span className="text-[13px] text-subtle leading-none">on Bolt Food</span>
            </span>
          </div>

          {/* Spinning stamp */}
          <div className="absolute right-[6%] top-[4%] w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-brand-deep text-cream flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 120 120" aria-hidden className="absolute inset-0 w-full h-full motion-safe:animate-[spin_22s_linear_infinite]">
              <defs>
                <path id="story-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
              </defs>
              <text fontSize="11.5" fontWeight="600" letterSpacing="3.2" fill="currentColor">
                <textPath href="#story-ring">BOBA · PIZZA · GOOD VIBES ·</textPath>
              </text>
            </svg>
            <svg viewBox="0 0 32 32" aria-hidden className="w-10 h-10">
              <path d="M10 11h12l-1.4 13.2a2 2 0 0 1-2 1.8h-5.2a2 2 0 0 1-2-1.8z" fill="#FBAD1C" />
              <path d="M9 11h14M17.5 11l2-6" stroke="#FFF7E8" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="13.6" cy="22" r="1.3" fill="#341830" />
              <circle cx="16.6" cy="23.2" r="1.3" fill="#341830" />
              <circle cx="18.6" cy="20.6" r="1.3" fill="#341830" />
            </svg>
          </div>
        </Reveal>

        {/* Words */}
        <Reveal className="flex flex-col gap-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Our story</p>
          <h2 className="font-display font-bold text-[40px] sm:text-[58px] leading-[1.02] text-brand-deep">
            Every cup comes with{" "}
            <span className="relative inline-block">
              <span className="relative z-10">good vibes</span>
              <span aria-hidden className="absolute left-[-2%] right-[-2%] bottom-[8%] h-[34%] rounded-full bg-gold -rotate-1" />
            </span>
          </h2>
          <p className="text-lg leading-relaxed text-subtle max-w-[540px]">
            Bobalicious is where Accra comes to treat itself: loaded milk teas, matcha and fruit teas shaken fresh, with wings, shawarma and
            jollof on the side. Between lectures, on a date or out with the crew, there&apos;s one near you.
          </p>

          <dl className="grid grid-cols-3 rounded-3xl bg-card border border-line divide-x divide-line">
            {STATS.map((s) => (
              <div key={s.label} className="px-4 sm:px-6 py-5 flex flex-col gap-1">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display font-bold text-3xl sm:text-[40px] leading-none text-brand">
                  {s.value}
                  {s.unit && <span className="text-lg sm:text-xl ml-1">{s.unit}</span>}
                </dd>
                <dd className="text-[13px] sm:text-sm text-subtle leading-snug">{s.label}</dd>
              </div>
            ))}
          </dl>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-[16px]">
                <span className="w-6 h-6 rounded-full bg-brand text-cream flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </span>
                {perk}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-4 pt-1">
            <ArrowButton href="/menu" tone="purple">
              See the menu
            </ArrowButton>
            <Link href={"/#branches" as "/"} className="group inline-flex items-center gap-3 font-medium hover:text-brand min-h-11">
              Find a branch <LongArrow className="w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

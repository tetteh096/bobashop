"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m } from "motion/react";
import { MessageCircle } from "lucide-react";
import { ORIGINS, PRODUCTS, type OriginId } from "@bobashop/api/data/catalog";
import { FREE_DELIVERY_THRESHOLD } from "@bobashop/api/pricing";
import { SHOP } from "@bobashop/api/data/shop";
import { ProductCard } from "@/components/shop/product-card";
import { Cup } from "@/components/shop/product-art";
import { useCart } from "@/components/shop/cart-context";
import { formatGHS } from "@/components/shop/money";
import { ArrowButton, Eyebrow, LongArrow } from "@/components/arrow-button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { TeaLeaves } from "@/components/tea-leaves";

const HERO = PRODUCTS.find((p) => p.badge === "Best seller") ?? PRODUCTS[0];
const SEASONAL = PRODUCTS.filter((p) => p.category === "seasonal" || p.badge === "Best seller").slice(0, 4);

const STEPS = [
  { title: "Brew", text: "Loose leaf, steeped at the right temperature for each tea, in small batches through the day." },
  { title: "Cook", text: "Tapioca pearls cooked in-house and rested in brown sugar syrup, so they're soft and warm." },
  { title: "Shake", text: "Your sweetness and ice, shaken by hand so every sip of the cup tastes the same." },
  { title: "Pour", text: `Over pearls and sealed, ready for pickup in about ${SHOP.pickupMinutes} minutes or out for delivery.` },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  const router = useRouter();
  const { setSelectedCategory, setSelectedOrigin, setSearchQuery } = useCart();

  const browseOrigin = (origin: OriginId) => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedOrigin(origin);
    router.push("/menu");
  };

  return (
    <div>
      {/* Hero */}
      <section className="flex flex-wrap bg-brand-deep text-cream">
        <div className="flex-[1_1_520px] min-w-0 bg-night relative overflow-hidden flex items-center justify-center px-6 py-16 sm:py-20 min-h-[420px] lg:min-h-[720px]">
          <span aria-hidden className="absolute w-[min(640px,130%)] aspect-square rounded-full border border-cream/10" />
          <span aria-hidden className="absolute w-[min(780px,160%)] aspect-square rounded-full border border-cream/[0.06]" />
          <m.div
            initial={{ opacity: 0, rotate: -20, scale: 0.92 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 1.1, ease: EASE }}
            className="relative w-[min(78vw,460px)]"
          >
            <span className="absolute -top-2 -right-2 sm:top-2 sm:right-0 z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-tomato text-white flex flex-col items-center justify-center text-center rotate-12 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
              <span className="font-display text-[11px] uppercase tracking-[0.14em]">Most</span>
              <span className="font-display text-lg sm:text-xl uppercase leading-none">loved</span>
            </span>
            <Cup color={HERO.color} label={`${HERO.name}, seen from above`} className="w-full h-auto" />
          </m.div>
          <Link
            href={`/menu/${HERO.id}` as "/"}
            className="absolute left-5 bottom-5 sm:left-8 sm:bottom-8 text-[13px] tracking-[0.14em] uppercase text-cream/70 hover:text-cream"
          >
            {HERO.name} · {HERO.tea}
          </Link>
        </div>

        <div className="flex-[1_1_520px] min-w-0 flex flex-col justify-center gap-12 px-5 sm:px-12 lg:px-20 py-14 sm:py-20">
          <div className="flex flex-wrap gap-2.5">
            <Eyebrow tone="light">real tea</Eyebrow>
            <Eyebrow tone="light">hand-cooked pearls</Eyebrow>
            <Eyebrow tone="light">pickup &amp; delivery</Eyebrow>
          </div>
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            className="flex flex-col gap-7"
          >
            <h1 className="font-display font-light uppercase tracking-[0.02em] leading-[0.95] text-[56px] sm:text-[80px] lg:text-[104px]">
              Boba
              <br />
              licious<span className="text-tomato">.</span>
            </h1>
            <p className="text-xl sm:text-2xl leading-snug max-w-[560px] text-cream/85">
              Boba built on real tea. Every base starts with a named leaf (Taiwanese oolong, Assam black, Uji matcha),
              brewed fresh and poured over pearls we cook by hand.
            </p>
            <div className="flex flex-wrap gap-3">
              <ArrowButton href="/menu">Explore the menu</ArrowButton>
              <ArrowButton href={`/menu/${HERO.id}`} tone="ghost-light" arrow={false}>
                Order the {HERO.name}
              </ArrowButton>
            </div>
          </m.div>
        </div>
      </section>

      {/* Collection */}
      <section className="relative isolate max-w-[1280px] mx-auto px-4 sm:px-8 py-24 sm:py-28 flex flex-col items-center gap-12 sm:gap-14">
        <div aria-hidden className="absolute inset-0 overflow-hidden -z-10">
          <TeaLeaves className="absolute -left-28 top-4 w-[320px] sm:w-[440px]" />
          <TeaLeaves flip className="hidden md:block absolute -right-20 bottom-10 w-[400px] -rotate-12" />
        </div>
        <Reveal className="text-center flex flex-col gap-4 max-w-[640px]">
          <h2 className="font-display font-light uppercase tracking-[0.02em] leading-none text-[38px] sm:text-6xl">This season</h2>
          <p className="text-lg sm:text-[19px] text-subtle">Roasted, nutty and slow-sweet, plus the one everybody orders.</p>
        </Reveal>
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {SEASONAL.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <Link href="/menu" className="group inline-flex items-center gap-3 font-display text-xl hover:text-brand">
          See the full menu <LongArrow className="transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Origins */}
      <section id="origins" className="bg-brand-deep text-cream scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-24 sm:py-28 flex flex-col gap-14">
          <Reveal className="flex flex-wrap justify-between items-end gap-8">
            <h2 className="max-w-[720px] font-display font-light text-[34px] sm:text-[52px] leading-[1.08]">
              Chosen by where the leaf grows, not by the syrup we add.
            </h2>
            <p className="max-w-[380px] text-[17px] leading-relaxed text-cream/75">
              Region, cultivar and harvest shape the taste of every cup. We tell you all three.
            </p>
          </Reveal>
          <RevealGroup className="grid grid-cols-1 md:grid-cols-3 border-t border-cream/25">
            {ORIGINS.map((o, i) => (
              <RevealItem key={o.id} className="pt-9 pb-2 md:pr-8 md:[&:not(:last-child)]:border-r border-cream/15 md:[&:not(:first-child)]:pl-8 flex flex-col gap-4">
                <span className="font-display font-light text-[15px] tracking-[0.16em] text-[#F2735C]">0{i + 1}</span>
                <h3 className="font-display text-3xl font-normal">{o.name}</h3>
                <p className="text-base leading-relaxed text-cream/75 max-w-[340px]">{o.text}</p>
                <button
                  type="button"
                  onClick={() => browseOrigin(o.id)}
                  className="group self-start inline-flex items-center gap-3 min-h-11 text-sm uppercase tracking-[0.08em] hover:text-gold cursor-pointer"
                >
                  {o.teas} <LongArrow className="w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="relative isolate max-w-[1280px] mx-auto px-4 sm:px-8 py-24 sm:py-28 flex flex-col gap-12 scroll-mt-20">
        <div aria-hidden className="absolute inset-0 overflow-hidden -z-10">
          <TeaLeaves flip className="absolute -right-24 -top-6 w-[300px] sm:w-[400px] rotate-12" />
        </div>
        <Reveal>
          <h2 className="font-display font-light uppercase tracking-[0.02em] text-[34px] sm:text-[52px] leading-none">How a cup is made</h2>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((s, i) => (
            <RevealItem key={s.title} className="border-t border-ink pt-6 flex flex-col gap-3">
              <span className="font-display font-light text-5xl leading-none text-tomato">0{i + 1}</span>
              <h3 className="font-display text-2xl font-normal">{s.title}</h3>
              <p className="text-base leading-relaxed text-subtle">{s.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Visit */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 pb-24">
        <Reveal className="bg-tint px-6 py-10 sm:p-14 flex flex-wrap gap-12 justify-between">
          <div className="flex-[1_1_360px] min-w-0 flex flex-col gap-6">
            <h2 className="font-display font-light uppercase text-[32px] sm:text-5xl leading-none">Visit the tea bar</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-base">
              <Info label="Address" value={SHOP.address} />
              <Info label="Pickup" value={`Ready in about ${SHOP.pickupMinutes} min`} />
              <div className="flex flex-col gap-1 sm:col-span-2">
                <dt className="text-[13px] uppercase tracking-[0.1em] text-subtle">Hours</dt>
                {SHOP.hours.map((h) => (
                  <dd key={h.days} className="flex justify-between max-w-sm">
                    <span>{h.days}</span>
                    <span className="text-subtle">{h.time}</span>
                  </dd>
                ))}
              </div>
            </dl>
          </div>
          <div className="flex-[1_1_320px] min-w-0 flex flex-col gap-5 justify-center">
            <h3 className="font-display text-2xl font-normal">Skip the queue</h3>
            <p className="text-base leading-relaxed text-subtle">
              Order ahead and we&apos;ll have it ready at the counter, or get it delivered: free over{" "}
              {formatGHS(FREE_DELIVERY_THRESHOLD)}.
            </p>
            <div className="flex flex-wrap gap-3">
              <ArrowButton href="/menu">Order now</ArrowButton>
              <ArrowButton href={`https://wa.me/${SHOP.whatsapp}`} external tone="outline" arrow={false}>
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" strokeWidth={1.5} /> WhatsApp us
                </span>
              </ArrowButton>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] uppercase tracking-[0.1em] text-subtle">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

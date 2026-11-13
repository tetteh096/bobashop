"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, MessageCircle, Phone } from "lucide-react";
import { DRINK_CATEGORIES as CATEGORIES, PRODUCTS } from "@bobashop/api/data/catalog";
import { BRANCHES, SHOP } from "@bobashop/api/data/shop";
import { ProductCard } from "@/components/shop/product-card";
import { ArrowButton, LongArrow } from "@/components/arrow-button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { useBranch } from "@/components/branch";
import { HeroSlider } from "@/components/hero-slider";
import { HowItWorks } from "@/components/home/how-it-works";
import { OurStory } from "@/components/home/our-story";
import { Testimonials } from "@/components/home/testimonials";

const FAVOURITES = [
  ...PRODUCTS.filter((p) => p.badge === "Best seller" || p.badge === "New"),
  ...PRODUCTS.filter((p) => ["kit-kat", "vanilla-biscoff-latte", "oreo-cookie-crush", "mangolicious"].includes(p.id)),
].slice(0, 8);

const STRIP = ["Milk tea", "Matcha", "Fruit tea", "Pizza", "Call or WhatsApp", "Delivery available", "5 branches in Accra"];

export default function HomePage() {
  const { branch, contact, setBranchId } = useBranch();
  const orderLink = (what: string) =>
    `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hi Bobalicious, I'd like to order some ${what}.`)}`;

  return (
    <div>
      <HeroSlider />

      {/* Strip */}
      <div className="bg-brand-deep text-cream overflow-hidden py-4" aria-hidden>
        <div className="flex w-max animate-marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0">
              {STRIP.map((t) => (
                <span key={t} className="font-display text-xl sm:text-2xl font-semibold px-6 flex items-center gap-6 whitespace-nowrap">
                  {t} <span className="w-2 h-2 rounded-full bg-gold" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Favourites */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 py-20 sm:py-24 flex flex-col gap-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <p className="font-medium text-brand">The ones everyone orders</p>
            <h2 className="font-display font-bold text-[40px] sm:text-6xl leading-none text-brand-deep">Crowd favourites</h2>
          </div>
          <div role="list" aria-label="Menu sections" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span role="listitem" key={c.id} className="rounded-full bg-tint px-4 py-2 text-sm">
                {c.name}
              </span>
            ))}
          </div>
        </Reveal>
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {FAVOURITES.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <Link href="/menu" className="self-center group inline-flex items-center gap-3 font-display text-xl font-semibold hover:text-brand">
          See the full menu <LongArrow className="transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      <HowItWorks />

      {/* Boba, pizza, food */}
      <section id="food" className="max-w-[1280px] mx-auto px-4 sm:px-8 py-20 sm:py-24 flex flex-col gap-10 scroll-mt-24">
        <Reveal className="flex flex-col gap-3">
          <p className="font-medium text-brand">More than boba</p>
          <h2 className="font-display font-bold text-[40px] sm:text-6xl leading-none text-brand-deep">Sip it. Bite it. Share it.</h2>
        </Reveal>
        <RevealGroup className="grid md:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              tag: "Boba",
              tagStyle: "bg-gold text-ink",
              image: "/images/boba-caramel.jpg",
              title: "Biscoff, Oreo, Kit Kat. In your milk tea.",
              text: "Plus matcha five ways and fruit teas full of popping pearls.",
              cta: <ArrowButton href="/menu" tone="mango">Build your cup</ArrowButton>,
            },
            {
              tag: "Pizza",
              tagStyle: "bg-tomato text-white",
              image: "/images/pizza-cheese-pull.jpg",
              title: "That cheese pull, though.",
              text: "Hot, loaded pizza, made to share (or not).",
              cta: (
                <ArrowButton href={orderLink("pizza")} external tone="brand">
                  Order pizza
                </ArrowButton>
              ),
            },
            {
              tag: "Food",
              tagStyle: "bg-cream text-ink",
              image: "/images/food-wings.jpg",
              title: "Wings, shawarma and jollof.",
              text: "Four kinds of wings, loaded shawarma and assorted rice. Add it to your boba order.",
              cta: (
                <ArrowButton href="/menu?tab=food" tone="butter">
                  See the food menu
                </ArrowButton>
              ),
            },
          ].map((card) => (
            <RevealItem key={card.tag} className="group relative min-h-[440px] sm:min-h-[520px] rounded-[28px] overflow-hidden text-cream flex">
              <Image src={card.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/40 to-transparent" />
              <div className="relative mt-auto p-6 sm:p-8 flex flex-col gap-3 items-start">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${card.tagStyle}`}>{card.tag}</span>
                <h3 className="font-display font-bold text-3xl sm:text-[34px] leading-[1.05]">{card.title}</h3>
                <p className="text-cream/80">{card.text}</p>
                <div className="pt-2">{card.cta}</div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
        <p className="text-sm text-subtle">Pizza isn&apos;t on the online menu yet, so order it on WhatsApp from {branch ? branch.name : "your branch"}.</p>
      </section>

      {/* Branches */}
      <section id="branches" className="bg-brand-deep text-cream scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-20 sm:py-24 flex flex-col gap-10">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <p className="font-medium text-gold">Call or WhatsApp</p>
              <h2 className="font-display font-bold text-[40px] sm:text-6xl leading-none">Find your Bobalicious</h2>
            </div>
            <p className="max-w-sm text-cream/75">
              {BRANCHES.length} branches across Accra. Pick one and your order goes straight to them, ready in about {SHOP.pickupMinutes}{" "}
              minutes.
            </p>
          </Reveal>
          {/* Phones: a row you swipe, with the next card peeking in. Wider screens: a grid. */}
          <RevealGroup className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:overflow-visible">
            {BRANCHES.map((b) => {
              const selected = branch?.id === b.id;
              return (
                <RevealItem
                  key={b.id}
                  className={`snap-start shrink-0 w-[76%] sm:w-auto rounded-3xl p-5 flex flex-col gap-4 ${selected ? "bg-gold text-ink" : "bg-cream/[0.07] hover:bg-cream/[0.12]"} transition-colors`}
                >
                  <div>
                    <h3 className="font-display text-2xl font-semibold leading-tight">{b.name}</h3>
                    <p className={`mt-1.5 text-sm ${selected ? "text-ink/75" : "text-cream/70"}`}>{b.address}</p>
                  </div>
                  <a href={b.telHref} className="inline-flex items-center gap-2 font-medium hover:underline underline-offset-4">
                    <Phone className="w-4 h-4" strokeWidth={2} /> {b.phone}
                  </a>
                  <div className="mt-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBranchId(b.id)}
                      className={`flex-1 min-h-11 rounded-full text-sm font-medium cursor-pointer ${
                        selected ? "bg-brand-deep text-cream" : "bg-cream text-ink hover:bg-gold"
                      }`}
                    >
                      {selected ? "Your branch" : "Order here"}
                    </button>
                    <a
                      href={`https://wa.me/${b.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`WhatsApp ${b.name}`}
                      className={`w-11 h-11 rounded-full flex items-center justify-center border ${selected ? "border-ink/30" : "border-cream/30"} hover:border-current`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      <OurStory />
      <Testimonials />

      {/* Instagram */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 py-20 sm:py-24 flex flex-col gap-10">
        <Reveal className="text-center flex flex-col items-center gap-3">
          <h2 className="font-display font-bold text-[40px] sm:text-6xl leading-none text-brand-deep">Sip, snap, tag us</h2>
          <p className="text-lg text-subtle">
            Show us your cup <a href={SHOP.instagram} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline underline-offset-4">{SHOP.instagramHandle}</a>
          </p>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { src: "/images/vibes-cheers.jpg", alt: "A woman with an afro offering a bubble tea to the camera" },
            { src: "/images/boba-in-hand.jpg", alt: "A hand holding an iced milk tea with pearls" },
            { src: "/images/pizza-slice-hand.jpg", alt: "A hand pulling a slice of pepperoni pizza" },
            { src: "/images/vibes-park.jpg", alt: "A young woman with a drink, smiling at her phone in the park" },
          ].map((img, i) => (
            <a
              key={img.src}
              href={SHOP.instagram}
              target="_blank"
              rel="noreferrer"
              className={`group relative aspect-square rounded-3xl overflow-hidden ${i % 2 ? "md:translate-y-6" : ""}`}
            >
              <Image src={img.src} alt={img.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              <span className="absolute inset-0 bg-brand-deep/0 group-hover:bg-brand-deep/40 transition-colors flex items-center justify-center">
                <Camera className="w-8 h-8 text-cream opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Order CTA */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 pb-24">
        <Reveal className="rounded-[32px] bg-tomato text-white px-6 py-12 sm:p-16 flex flex-wrap items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-xl">
            <h2 className="font-display font-bold text-4xl sm:text-5xl leading-[1.02]">Craving hit? We&apos;ve got you.</h2>
            <p className="text-white/85 text-lg">Order online, or call or WhatsApp {branch ? branch.name : "your nearest branch"} on {contact.phone}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ArrowButton href="/menu" tone="mango">
              Order now
            </ArrowButton>
            <ArrowButton href={`https://wa.me/${contact.whatsapp}`} external tone="ghost-light" arrow={false}>
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="w-4 h-4" strokeWidth={2} /> WhatsApp us
              </span>
            </ArrowButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

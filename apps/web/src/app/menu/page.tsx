"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { MessageCircle, Search, X } from "lucide-react";
import { Select } from "@bobashop/ui/components/select";
import {
  CATEGORIES,
  DRINK_CATEGORIES,
  DRINKS,
  FOOD_CATEGORIES,
  FOOD_ITEMS,
  PRODUCTS,
  categoryName,
  type CategoryId,
  type MenuKind,
} from "@bobashop/api/data/catalog";
import { BRANCHES } from "@bobashop/api/data/shop";
import { isAvailableAt } from "@bobashop/api/branch-menu";
import { ArrowButton, Breadcrumb, LongArrow } from "@/components/arrow-button";
import { ProductCard } from "@/components/shop/product-card";
import { useCart } from "@/components/shop/cart-context";
import { useBranch } from "@/components/branch";
import { formatGHS } from "@/components/shop/money";

const SORT_OPTIONS = {
  featured: "Most popular",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name: A to Z",
} as const;
type SortKey = keyof typeof SORT_OPTIONS;
const SORT_SELECT_OPTIONS = (Object.keys(SORT_OPTIONS) as SortKey[]).map((value) => ({ value, label: SORT_OPTIONS[value] }));

const COUNTS = Object.fromEntries(CATEGORIES.map((c) => [c.id, PRODUCTS.filter((p) => p.category === c.id).length])) as Record<
  CategoryId,
  number
>;
const FROM_PRICE = Object.fromEntries(
  CATEGORIES.map((c) => {
    const priced = PRODUCTS.filter((p) => p.category === c.id && !p.askPrice).map((p) => p.price);
    return [c.id, priced.length ? Math.min(...priced) : null];
  })
) as Record<CategoryId, number | null>;

const KINDS = {
  drink: {
    items: DRINKS,
    categories: DRINK_CATEGORIES,
    noun: "drinks",
    image: "/images/hero-brown-sugar.jpg",
    blurb: "Milk teas loaded with Biscoff, Oreo and Kit Kat, matcha five ways and ice-cold fruit teas. Pick your sweetness, pick your pearls.",
    placeholder: "Search taro, Oreo, mango…",
  },
  food: {
    items: FOOD_ITEMS,
    categories: FOOD_CATEGORIES,
    noun: "dishes",
    image: "/images/food-jollof.jpg",
    blurb: "Wings in four flavours, loaded shawarma, assorted jollof and fried rice, fries and small bites. Hot, fresh and made to share.",
    placeholder: "Search wings, shawarma, jollof…",
  },
} as const;

/**
 * The tab lives in the address (?tab=food), so the header's Food link, /food and the back button
 * all switch it. The prerendered page shows the drinks tab until the browser reads the address.
 */
export default function MenuPage() {
  return (
    <Suspense fallback={<MenuContent urlKind="drink" />}>
      <MenuFromUrl />
    </Suspense>
  );
}

function MenuFromUrl() {
  const params = useSearchParams();
  return <MenuContent urlKind={params.get("tab") === "food" ? "food" : "drink"} />;
}

function MenuContent({ urlKind }: { urlKind: MenuKind }) {
  const router = useRouter();
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useCart();
  const { branch, openPicker, contact, setBranchId } = useBranch();
  const kind = urlKind;
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [dairyFree, setDairyFree] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const q = searchQuery.trim().toLowerCase();
  // With no search or filters, the menu reads like a printed one: every section in turn.
  const browsing = !q && !dairyFree && sortBy === "featured";

  const current = KINDS[kind];

  const filtered = useMemo(() => {
    return KINDS[kind].items.filter((p) => {
      // Only what the chosen branch makes.
      if (!isAvailableAt(p, branch)) return false;
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (dairyFree && !p.dairyFree) return false;
      if (!q) return true;
      return [p.name, p.notes, categoryName(p.category)].some((f) => f.toLowerCase().includes(q));
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [q, kind, branch, selectedCategory, dairyFree, sortBy]);

  const sections = (selectedCategory === "all" ? current.categories : current.categories.filter((c) => c.id === selectedCategory)).map((c) => ({
    ...c,
    items: filtered.filter((p) => p.category === c.id),
  })).filter((section) => section.items.length > 0);

  // At a drinks-and-bites branch, say where the rest of the food menu is.
  const fullKitchens = BRANCHES.filter((b) => b.kitchen === "full" && b.orderingOpen);

  // Arriving with a section chosen elsewhere (footer, mobile menu): scroll to it.
  useEffect(() => {
    if (selectedCategory !== "all") resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the tab changes (Food link, back button), drop a section or filter from the other tab.
  useEffect(() => {
    const sectionKind = CATEGORIES.find((c) => c.id === selectedCategory)?.kind;
    if (sectionKind && sectionKind !== kind) setSelectedCategory("all");
    if (kind === "food") setDairyFree(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const setKind = (next: MenuKind) => {
    if (next === kind) return;
    setSelectedCategory("all");
    router.replace((next === "food" ? "/menu?tab=food" : "/menu") as "/", { scroll: false });
  };

  const chooseCategory = (id: CategoryId | "all") => {
    setSelectedCategory(id);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearAll = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setDairyFree(false);
    setSortBy("featured");
  };

  const tab = (active: boolean) =>
    `shrink-0 inline-flex items-center gap-2 min-h-11 pl-4 pr-3 rounded-full text-[15px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
      active ? "bg-brand-deep text-cream" : "bg-card border border-line hover:border-brand-deep"
    }`;
  const count = (active: boolean) =>
    `min-w-6 h-6 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${active ? "bg-gold text-ink" : "bg-tint text-subtle"}`;

  return (
    <div className="pb-24">
      {/* Banner */}
      <section className="bg-paper">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-5">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: kind === "food" ? "Food" : "Menu" }]} />
          <div className="mt-5 relative overflow-hidden rounded-[32px] bg-brand-deep text-cream">
            <div className="absolute inset-0">
              <Image
                key={current.image}
                src={current.image}
                alt=""
                fill
                priority
                sizes="(min-width: 1280px) 1216px, 100vw"
                className={`object-cover ${kind === "food" ? "object-[85%_center]" : "object-[88%_center]"}`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/85 md:via-brand-deep/55 to-transparent" />
            </div>
            <span aria-hidden className="absolute -left-16 -bottom-24 w-72 h-72 rounded-full bg-gold/15" />

            <div className="relative px-6 sm:px-12 py-12 sm:py-16 max-w-[640px] flex flex-col gap-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">The menu</p>
              <h1 className="font-display font-bold text-[44px] sm:text-[68px] leading-[0.98]">What are you craving?</h1>
              <div role="tablist" aria-label="Drinks or food" className="self-start inline-flex p-1.5 rounded-full bg-cream/10 border border-cream/15">
                {(["drink", "food"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={kind === k}
                    onClick={() => setKind(k)}
                    className={`min-h-11 px-6 rounded-full text-base font-semibold transition-colors cursor-pointer inline-flex items-center gap-2 ${
                      kind === k ? "bg-gold text-ink" : "text-cream/80 hover:text-cream"
                    }`}
                  >
                    {k === "drink" ? "Drinks" : "Food"}
                  </button>
                ))}
              </div>
              <p className="text-lg text-cream/80 max-w-[500px]">{current.blurb}</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-14 rounded-full bg-paper text-ink pl-5 pr-2 shadow-lg max-w-[520px]">
                <Search className="w-5 h-5 text-subtle shrink-0" strokeWidth={2} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={current.placeholder}
                  aria-label="Search the menu"
                  className="flex-1 min-w-0 bg-transparent px-3 text-base placeholder:text-subtle/80 focus:outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="w-10 h-10 rounded-full hover:bg-tint flex items-center justify-center cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-cream/80">
                <span>
                  from{" "}
                  <strong className="font-display text-gold text-lg">
                    {formatGHS(Math.min(...current.items.filter((p) => !p.askPrice).map((p) => p.price)))}
                  </strong>
                </span>
                <button type="button" onClick={openPicker} className="underline underline-offset-4 decoration-cream/40 hover:decoration-cream cursor-pointer">
                  {branch ? `Ordering from ${branch.name}` : `Choose from ${BRANCHES.length} branches`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky section tabs and filters */}
      <div ref={resultsRef} className="scroll-mt-[68px] lg:scroll-mt-20" />
      <div className="sticky top-[68px] lg:top-20 z-30 bg-paper/95 backdrop-blur border-b border-line mt-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-3 flex items-center gap-3">
          <div role="group" aria-label="Menu section" className="flex-1 min-w-0 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1">
            <button type="button" aria-pressed={selectedCategory === "all"} onClick={() => chooseCategory("all")} className={tab(selectedCategory === "all")}>
              All
            </button>
            {current.categories.map((c) => (
              <button key={c.id} type="button" aria-pressed={selectedCategory === c.id} onClick={() => chooseCategory(c.id)} className={tab(selectedCategory === c.id)}>
                {c.name} <span className={count(selectedCategory === c.id)}>{COUNTS[c.id]}</span>
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {kind === "drink" && <label className="flex items-center gap-2 min-h-11 text-[15px] cursor-pointer">
              <input type="checkbox" checked={dairyFree} onChange={(e) => setDairyFree(e.target.checked)} className="w-4 h-4 accent-brand" />
              Dairy-free
            </label>}
            <Select aria-label="Sort by" value={sortBy} onValueChange={setSortBy} options={SORT_SELECT_OPTIONS} className="rounded-full" popupClassName="min-w-52" />
          </div>
        </div>
        {/* Filters on phones */}
        <div className="md:hidden max-w-[1280px] mx-auto px-4 pb-3 flex items-center justify-between gap-3">
          {kind === "drink" ? <label className="flex items-center gap-2 min-h-11 text-[15px] cursor-pointer">
            <input type="checkbox" checked={dairyFree} onChange={(e) => setDairyFree(e.target.checked)} className="w-4 h-4 accent-brand" />
            Dairy-free
          </label> : <span />}
          <Select aria-label="Sort by" value={sortBy} onValueChange={setSortBy} options={SORT_SELECT_OPTIONS} className="rounded-full" popupClassName="min-w-52" />
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        {kind === "food" && branch?.kitchen === "bites" && (
          <div className="mt-8 rounded-[24px] bg-gold-soft border border-gold/40 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl font-semibold">{branch.name} serves drinks and bites</p>
              <p className="text-[15px] text-ink/75">For wings, fries, rice and shawarma, order from one of these branches.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {fullKitchens.map((b) => (
                <button key={b.id} type="button" onClick={() => setBranchId(b.id)} className="min-h-11 px-4 rounded-full bg-brand-deep text-cream hover:bg-night text-sm font-medium cursor-pointer">
                  Switch to {b.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {!branch && (
          <div className="mt-8 rounded-[24px] bg-card border border-line p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[15px]">
              <span className="font-semibold">Choose your branch</span> to see exactly what it serves and what delivery costs.
            </p>
            <button type="button" onClick={openPicker} className="min-h-11 px-5 rounded-full bg-gold text-ink hover:bg-[#f39c0a] text-sm font-semibold cursor-pointer">
              Choose branch
            </button>
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="mt-10 rounded-[28px] bg-card border border-line p-10 sm:p-16 text-center">
            <p className="font-display text-3xl font-bold">Nothing matches that</p>
            <p className="mt-3 text-subtle max-w-md mx-auto">Try another word or fewer filters, or WhatsApp us and we&apos;ll help you pick.</p>
            <button type="button" onClick={clearAll} className="mt-7 min-h-12 px-7 rounded-full bg-brand-deep text-cream hover:bg-night cursor-pointer">
              Clear filters
            </button>
          </div>
        ) : browsing ? (
          sections.map((section, i) => (
            <React.Fragment key={section.id}>
              <section aria-labelledby={`sec-${section.id}`} className="mt-12 sm:mt-14">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-brand-deep pb-4">
                  <div>
                    <h2 id={`sec-${section.id}`} className="font-display font-bold text-[32px] sm:text-[42px] leading-none text-brand-deep">
                      {section.name}
                    </h2>
                    <p className="mt-2 text-subtle">{section.blurb}</p>
                  </div>
                  <p className="text-[15px] text-subtle">
                    {section.items.length} {current.noun}
                    {FROM_PRICE[section.id] != null && (
                      <>
                        {" "}
                        · from <span className="font-semibold text-brand">{formatGHS(FROM_PRICE[section.id]!)}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {section.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
              {selectedCategory === "all" && i === 1 && kind === "drink" && <FoodBanner onShowFood={() => setKind("food")} />}
            </React.Fragment>
          ))
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] text-subtle" aria-live="polite">
                {filtered.length} {filtered.length === 1 ? current.noun.slice(0, -1) : current.noun}
                {q && (
                  <>
                    {" "}
                    for <span className="font-semibold text-ink">&ldquo;{searchQuery.trim()}&rdquo;</span>
                  </>
                )}
              </p>
              <button type="button" onClick={clearAll} className="text-[15px] underline underline-offset-4 hover:text-brand cursor-pointer min-h-11">
                Clear all
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {kind === "drink" && (selectedCategory !== "all" || !browsing) && filtered.length > 0 && <FoodBanner onShowFood={() => setKind("food")} />}
        {kind === "food" && filtered.length > 0 && <PizzaNote whatsapp={contact.whatsapp} branchName={branch?.name} />}
      </div>
    </div>
  );
}

function FoodBanner({ onShowFood }: { onShowFood: () => void }) {
  return (
    <aside className="mt-14 relative overflow-hidden rounded-[32px] bg-tomato text-white grid md:grid-cols-[1.1fr_1fr]">
      <div className="relative z-10 p-7 sm:p-12 flex flex-col gap-4 items-start">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">Hungry too?</p>
        <h2 className="font-display font-bold text-[34px] sm:text-5xl leading-[1.02]">Boba tastes better with wings.</h2>
        <p className="text-white/85 max-w-md">Suya, BBQ or hot chilli wings, loaded shawarma and assorted jollof. Add them to the same order.</p>
        <button
          type="button"
          onClick={() => {
            onShowFood();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="group inline-flex items-center gap-3 min-h-13 px-7 rounded-full bg-gold text-ink hover:bg-[#f39c0a] font-medium cursor-pointer"
        >
          See the food menu <LongArrow className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
      <div className="relative min-h-[220px] md:min-h-full">
        <Image src="/images/food-wings.jpg" alt="A plate of glazed BBQ chicken wings" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-tomato via-tomato/20 to-transparent" />
      </div>
    </aside>
  );
}

function PizzaNote({ whatsapp, branchName }: { whatsapp: string; branchName?: string }) {
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi Bobalicious, I'd like to order a pizza.")}`;
  return (
    <aside className="mt-14 rounded-[28px] bg-brand-deep text-cream p-6 sm:p-8 flex flex-wrap items-center justify-between gap-5">
      <div>
        <p className="font-display text-2xl sm:text-3xl font-bold">Looking for pizza?</p>
        <p className="mt-1 text-cream/75">It isn&apos;t on the online menu yet. WhatsApp {branchName ?? "your branch"} and we&apos;ll sort you out.</p>
      </div>
      <ArrowButton href={href} external tone="mango" arrow={false}>
        <span className="inline-flex items-center gap-2">
          <MessageCircle className="w-4 h-4" strokeWidth={2} /> Order pizza on WhatsApp
        </span>
      </ArrowButton>
    </aside>
  );
}

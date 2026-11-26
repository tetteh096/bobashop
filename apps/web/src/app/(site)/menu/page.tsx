"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, SlidersHorizontal, Search, X } from "lucide-react";
import { Select } from "@bobashop/ui/components/select";
import type { MenuKind } from "@bobashop/api/data/catalog";
import { Breadcrumb, LongArrow } from "@/components/arrow-button";
import { ProductCard } from "@/components/shop/product-card";
import { useMenu } from "@/components/shop/menu-context";
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

const KINDS = {
  drink: {
    noun: "drinks",
    image: "/images/hero-brown-sugar.jpg",
    blurb: "Milk teas loaded with Biscoff, Oreo and Kit Kat, matcha five ways and ice-cold fruit teas. Pick your sweetness, pick your pearls.",
    placeholder: "Search taro, Oreo, mango…",
  },
  food: {
    noun: "dishes",
    image: "/images/food-jollof.jpg",
    blurb: "Pizza, burgers, wings, loaded shawarma, jollof and fried rice, salads and desserts. Hot, fresh and made to share.",
    placeholder: "Search pizza, wings, shawarma…",
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
  const { branch, branches, openPicker, findBranch } = useBranch();
  const { products, categories, menuBranchId, loading, failed } = useMenu();
  const menuBranch = findBranch(menuBranchId);
  const kind = urlKind;
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  /** Ticked sections; none ticked means every section. */
  const [picked, setPicked] = useState<string[]>([]);
  /** Price range the customer narrowed to; null means any price. */
  const [price, setPrice] = useState<{ min: number; max: number } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const q = searchQuery.trim().toLowerCase();
  // With no search and the default order, the menu reads like a printed one: section by section.
  const browsing = !q && sortBy === "featured";

  const current = KINDS[kind];
  const items = useMemo(() => products.filter((p) => p.kind === kind), [products, kind]);
  const kindCategories = useMemo(() => categories.filter((c) => c.kind === kind), [categories, kind]);
  const counts = useMemo(() => {
    const n = new Map<string, number>();
    for (const p of items) n.set(p.category, (n.get(p.category) ?? 0) + 1);
    return n;
  }, [items]);
  const fromPrice = (category?: string) => {
    const prices = items.filter((p) => p.inStock && (!category || p.category === category)).map((p) => p.fromPrice);
    return prices.length ? Math.min(...prices) : null;
  };
  // The price slider runs from the cheapest to the dearest item on this tab, in steps of GH₵5.
  const bounds = useMemo(() => {
    if (items.length === 0) return { min: 0, max: 0 };
    const prices = items.map((p) => p.fromPrice);
    return { min: Math.floor(Math.min(...prices) / 5) * 5, max: Math.ceil(Math.max(...prices) / 5) * 5 };
  }, [items]);
  const range = price ?? bounds;
  const priceNarrowed = price !== null && (price.min > bounds.min || price.max < bounds.max);

  const filtered = useMemo(() => {
    return items
      .filter((p) => {
        if (picked.length > 0 && !picked.includes(p.category)) return false;
        if (p.fromPrice < range.min || p.fromPrice > range.max) return false;
        if (!q) return true;
        return [p.name, p.notes, p.categoryName].some((f) => f.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.fromPrice - b.fromPrice;
        if (sortBy === "price-desc") return b.fromPrice - a.fromPrice;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        // Sold-out items sink to the end of their section.
        return Number(b.inStock) - Number(a.inStock);
      });
  }, [q, items, picked, range.min, range.max, sortBy]);

  const sections = kindCategories
    .filter((c) => picked.length === 0 || picked.includes(c.id))
    .map((c) => ({ ...c, items: filtered.filter((p) => p.category === c.id) }))
    .filter((section) => section.items.length > 0);

  // A section chosen elsewhere (footer, mobile menu) arrives as the one ticked box.
  useEffect(() => {
    if (selectedCategory === "all") return;
    setPicked([selectedCategory]);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSelectedCategory("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // A new tab has its own sections and prices.
  useEffect(() => {
    setPicked([]);
    setPrice(null);
  }, [kind]);

  // The phone filter sheet locks the page behind it and closes on Escape.
  useEffect(() => {
    if (!filtersOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFiltersOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const setKind = (next: MenuKind) => {
    if (next === kind) return;
    router.replace((next === "food" ? "/menu?tab=food" : "/menu") as "/", { scroll: false });
  };

  const togglePicked = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const clearAll = () => {
    setPicked([]);
    setPrice(null);
    setSearchQuery("");
    setSortBy("featured");
  };

  const activeCount = picked.length + (priceNarrowed ? 1 : 0);
  const noun = (n: number) => (n === 1 ? current.noun.slice(0, -1) : current.noun);

  const filterPanel = (
    <FilterPanel
      categories={kindCategories}
      counts={counts}
      picked={picked}
      onToggle={togglePicked}
      onAll={() => setPicked([])}
      total={items.length}
      bounds={bounds}
      range={range}
      onRange={setPrice}
      canClear={activeCount > 0 || Boolean(q)}
      onClear={clearAll}
    />
  );

  return (
    <div className="pb-24">
      {/* Banner */}
      <section className="bg-paper">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 pt-5">
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
                {fromPrice() !== null && (
                  <span>
                    from <strong className="font-display text-gold text-lg">{formatGHS(fromPrice()!)}</strong>
                  </span>
                )}
                <button type="button" onClick={openPicker} className="underline underline-offset-4 decoration-cream/40 hover:decoration-cream cursor-pointer">
                  {branch ? `Ordering from ${branch.name}` : menuBranch ? `${menuBranch.name}'s menu · change branch` : `Choose from ${branches.length} branches`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div ref={resultsRef} className="scroll-mt-[68px] lg:scroll-mt-20" />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 mt-8">
        {branch && !branch.orderingOpen && (
          <div role="status" className="mb-6 rounded-[24px] bg-tomato-soft text-tomato-dark p-5 sm:p-6">
            <p className="text-[15px]">
              <span className="font-semibold">{branch.closedMessage ?? `${branch.name} isn't taking online orders right now.`}</span> You can still
              look through the menu, or call {branch.phone}.
            </p>
          </div>
        )}
        {!branch && menuBranch && (
          <div className="mb-6 rounded-[24px] bg-card border border-line p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[15px]">
              Showing <span className="font-semibold">Bobalicious {menuBranch.name}</span>&apos;s menu. Choose your branch to see exactly what it serves today.
            </p>
            <button type="button" onClick={openPicker} className="min-h-11 px-5 rounded-full bg-gold text-ink hover:bg-[#f39c0a] text-sm font-semibold cursor-pointer">
              Choose branch
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          {/* Sidebar on wide screens */}
          <aside
            aria-label="Filter the menu"
            className="hidden lg:block sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[24px] bg-card border border-line p-5"
          >
            {loading ? <div className="h-80 rounded-2xl bg-tint animate-pulse" /> : filterPanel}
          </aside>

          <div className="min-w-0">
            {/* Count, sort and (on phones) the filter button */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] text-subtle" aria-live="polite">
                {loading ? (
                  "Loading the menu…"
                ) : (
                  <>
                    <span className="font-semibold text-ink">{filtered.length}</span> {noun(filtered.length)}
                    {q && (
                      <>
                        {" "}
                        for <span className="font-semibold text-ink">&ldquo;{searchQuery.trim()}&rdquo;</span>
                      </>
                    )}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 min-h-11 px-4 rounded-full border border-line bg-card hover:border-ink text-[15px] font-medium cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                  {activeCount > 0 && (
                    <span className="min-w-6 h-6 px-1.5 rounded-full bg-brand-deep text-cream text-xs font-semibold flex items-center justify-center">{activeCount}</span>
                  )}
                </button>
                <Select aria-label="Sort by" value={sortBy} onValueChange={setSortBy} options={SORT_SELECT_OPTIONS} className="rounded-full" popupClassName="min-w-52" />
              </div>
            </div>

            {/* What's filtering the list, each removable */}
            {(activeCount > 0 || q) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {picked.map((id) => (
                  <Chip key={id} onRemove={() => togglePicked(id)}>
                    {kindCategories.find((c) => c.id === id)?.name ?? id}
                  </Chip>
                ))}
                {priceNarrowed && (
                  <Chip onRemove={() => setPrice(null)}>
                    {formatGHS(range.min)} – {formatGHS(range.max)}
                  </Chip>
                )}
                {q && <Chip onRemove={() => setSearchQuery("")}>&ldquo;{searchQuery.trim()}&rdquo;</Chip>}
                <button type="button" onClick={clearAll} className="min-h-9 px-2 text-sm underline underline-offset-4 hover:text-brand cursor-pointer">
                  Clear all
                </button>
              </div>
            )}

            {loading ? (
              <MenuSkeleton />
            ) : failed ? (
              <div className="mt-8 rounded-[28px] bg-card border border-line p-10 sm:p-16 text-center">
                <p className="font-display text-3xl font-bold">The menu didn&apos;t load</p>
                <p className="mt-3 text-subtle max-w-md mx-auto">We couldn&apos;t reach the shop just now. Please try again in a minute.</p>
              </div>
            ) : items.length === 0 ? (
              <div className="mt-8 rounded-[28px] bg-card border border-line p-10 sm:p-16 text-center">
                <p className="font-display text-3xl font-bold">No {current.noun} here today</p>
                <p className="mt-3 text-subtle max-w-md mx-auto">{menuBranch ? `${menuBranch.name} isn't` : "This branch isn't"} serving any online today.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-8 rounded-[28px] bg-card border border-line p-10 sm:p-16 text-center">
                <p className="font-display text-3xl font-bold">Nothing matches that</p>
                <p className="mt-3 text-subtle max-w-md mx-auto">Try another word or fewer filters.</p>
                <button type="button" onClick={clearAll} className="mt-7 min-h-12 px-7 rounded-full bg-brand-deep text-cream hover:bg-night cursor-pointer">
                  Clear filters
                </button>
              </div>
            ) : browsing ? (
              sections.map((section) => (
                <section key={section.id} aria-labelledby={`sec-${section.id}`} className="mt-8 first:mt-6">
                  <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b-2 border-brand-deep pb-3">
                    <h2 id={`sec-${section.id}`} className="font-display font-bold text-[26px] sm:text-[32px] leading-none text-brand-deep">
                      {section.name}
                    </h2>
                    <p className="text-[15px] text-subtle">
                      {section.items.length} {noun(section.items.length)}
                      {fromPrice(section.id) != null && (
                        <>
                          {" "}
                          · from <span className="font-semibold text-brand">{formatGHS(fromPrice(section.id)!)}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                    {section.items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {kind === "drink" && filtered.length > 0 && <FoodBanner onShowFood={() => setKind("food")} />}
          </div>
        </div>
      </div>

      {/* Filters on phones: a sheet from the bottom */}
      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end bg-night/60" onClick={() => setFiltersOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter the menu"
            className="w-full max-h-[88vh] flex flex-col rounded-t-[28px] bg-paper"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="font-display text-2xl font-semibold">Filters</p>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="w-11 h-11 rounded-full hover:bg-tint flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4">{filterPanel}</div>
            <div className="p-4 border-t border-line">
              <button type="button" onClick={() => setFiltersOpen(false)} className="w-full min-h-13 rounded-full bg-brand-deep text-cream font-medium cursor-pointer">
                Show {filtered.length} {noun(filtered.length)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Range = { min: number; max: number };

function FilterPanel({
  categories,
  counts,
  picked,
  onToggle,
  onAll,
  total,
  bounds,
  range,
  onRange,
  canClear,
  onClear,
}: {
  categories: { id: string; name: string }[];
  counts: Map<string, number>;
  picked: string[];
  onToggle: (id: string) => void;
  onAll: () => void;
  total: number;
  bounds: Range;
  range: Range;
  onRange: (range: Range) => void;
  canClear: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-7">
      <div role="group" aria-labelledby="filter-categories">
        <div className="flex items-center justify-between pb-3">
          <p id="filter-categories" className="font-display text-lg font-semibold">Categories</p>
          {canClear && (
            <button type="button" onClick={onClear} className="text-sm underline underline-offset-4 hover:text-brand cursor-pointer">
              Clear all
            </button>
          )}
        </div>
        <ul className="flex flex-col">
          <li>
            <CheckRow checked={picked.length === 0} onClick={onAll} label="All" count={total} />
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <CheckRow checked={picked.includes(c.id)} onClick={() => onToggle(c.id)} label={c.name} count={counts.get(c.id) ?? 0} />
            </li>
          ))}
        </ul>
      </div>

      {bounds.max > bounds.min && (
        <fieldset>
          <legend className="pb-3 font-display text-lg font-semibold">Price</legend>
          <PriceRange bounds={bounds} range={range} onChange={onRange} />
        </fieldset>
      )}
    </div>
  );
}

function CheckRow({ checked, onClick, label, count }: { checked: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className="w-full flex items-center gap-3 min-h-11 py-1 text-left text-[15px] cursor-pointer group"
    >
      <span
        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-brand-deep border-brand-deep text-cream" : "border-line group-hover:border-ink"
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
      <span className={`flex-1 min-w-0 truncate ${checked ? "font-semibold" : ""}`}>{label}</span>
      <span className="min-w-7 h-6 px-1.5 rounded-full bg-tint text-xs font-semibold text-subtle flex items-center justify-center">{count}</span>
    </button>
  );
}

const THUMB =
  "absolute inset-0 w-full h-6 appearance-none bg-transparent pointer-events-none " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 " +
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-paper [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-deep [&::-webkit-slider-thumb]:cursor-pointer " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full " +
  "[&::-moz-range-thumb]:bg-paper [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand-deep [&::-moz-range-thumb]:cursor-pointer";

/** Two thumbs on one track: the cheapest and dearest "from" price to show. */
function PriceRange({ bounds, range, onChange }: { bounds: Range; range: Range; onChange: (range: Range) => void }) {
  const span = bounds.max - bounds.min || 1;
  const left = ((range.min - bounds.min) / span) * 100;
  const right = ((range.max - bounds.min) / span) * 100;
  return (
    <div>
      <div className="relative h-6">
        <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-1.5 rounded-full bg-tint" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-brand-deep" style={{ left: `${left}%`, right: `${100 - right}%` }} />
        <input
          type="range"
          aria-label="Lowest price"
          min={bounds.min}
          max={bounds.max}
          step={5}
          value={range.min}
          onChange={(e) => onChange({ min: Math.min(Number(e.target.value), range.max), max: range.max })}
          className={THUMB}
        />
        <input
          type="range"
          aria-label="Highest price"
          min={bounds.min}
          max={bounds.max}
          step={5}
          value={range.max}
          onChange={(e) => onChange({ min: range.min, max: Math.max(Number(e.target.value), range.min) })}
          className={THUMB}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="rounded-full bg-tint px-3 py-1.5 font-medium">{formatGHS(range.min)}</span>
        <span className="text-subtle">to</span>
        <span className="rounded-full bg-tint px-3 py-1.5 font-medium">{formatGHS(range.max)}</span>
      </div>
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 min-h-9 pl-3.5 pr-1.5 rounded-full bg-gold-soft border border-gold/50 text-sm font-medium">
      {children}
      <button type="button" onClick={onRemove} aria-label="Remove filter" className="w-7 h-7 rounded-full hover:bg-ink/10 flex items-center justify-center cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
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

function MenuSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5" aria-busy="true" aria-label="Loading the menu">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="rounded-[26px] border border-line p-2.5">
          <div className="aspect-[4/5] rounded-[20px] bg-tint animate-pulse" />
          <div className="mt-4 mx-2 h-5 w-3/4 rounded-full bg-tint animate-pulse" />
          <div className="mt-2 mx-2 mb-3 h-4 w-1/2 rounded-full bg-tint animate-pulse" />
        </div>
      ))}
    </div>
  );
}

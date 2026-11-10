"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Select } from "@bobashop/ui/components/select";
import { CATEGORIES, ORIGINS, PRODUCTS, categoryName, originName } from "@bobashop/api/data/catalog";
import { SHOP } from "@bobashop/api/data/shop";
import { Breadcrumb } from "@/components/arrow-button";
import { TeaLeaves } from "@/components/tea-leaves";
import { ProductCard } from "@/components/shop/product-card";
import { useCart } from "@/components/shop/cart-context";

const PAGE_SIZE = 12;

const SORT_OPTIONS = {
  featured: "Most popular",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name: A to Z",
} as const;
type SortKey = keyof typeof SORT_OPTIONS;
const SORT_SELECT_OPTIONS = (Object.keys(SORT_OPTIONS) as SortKey[]).map((value) => ({ value, label: SORT_OPTIONS[value] }));

export default function MenuPage() {
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, selectedOrigin, setSelectedOrigin } = useCart();
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [dairyFree, setDairyFree] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (selectedOrigin !== "all" && p.origin !== selectedOrigin) return false;
      if (dairyFree && !p.dairyFree) return false;
      if (!q) return true;
      return [p.name, p.notes, p.tea, categoryName(p.category), originName(p.origin)].some((f) => f.toLowerCase().includes(q));
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [searchQuery, selectedCategory, selectedOrigin, dairyFree, sortBy]);

  useEffect(() => setPage(1), [searchQuery, selectedCategory, selectedOrigin, dairyFree, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const clearAll = () => {
    setSelectedCategory("all");
    setSelectedOrigin("all");
    setSearchQuery("");
    setDairyFree(false);
  };

  const goToPage = (p: number) => {
    setPage(p);
    document.getElementById("menu-results")?.scrollIntoView({ behavior: "smooth" });
  };

  const tab = (active: boolean) =>
    `min-h-11 px-5 rounded-full border border-ink text-[15px] transition-colors cursor-pointer ${
      active ? "bg-ink text-paper" : "hover:bg-ink/5"
    }`;

  return (
    <div className="relative isolate max-w-[1280px] mx-auto px-4 sm:px-8 pt-6 pb-24">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[460px] overflow-hidden -z-10">
        <TeaLeaves className="absolute -left-24 -top-10 w-[300px] sm:w-[420px] opacity-90" />
        <TeaLeaves flip className="hidden md:block absolute -right-16 top-6 w-[380px] rotate-[18deg]" />
      </div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Menu" }]} />

      <div className="mt-10 sm:mt-12 flex flex-col items-center text-center gap-5">
        <h1 className="font-display text-[44px] sm:text-6xl lg:text-[76px] font-light uppercase tracking-[0.02em] leading-none">The menu</h1>
        <p className="max-w-[620px] text-lg sm:text-[19px] leading-relaxed text-subtle">
          Milk teas, fruit teas and matcha, each one built on a single named leaf and sweetened the way you like it.
        </p>
      </div>

      {/* Controls */}
      <div id="menu-results" className="mt-12 scroll-mt-24 border-y border-line py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} className={tab(selectedCategory === "all")}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" aria-pressed={selectedCategory === c.id} onClick={() => setSelectedCategory(c.id)} className={tab(selectedCategory === c.id)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 min-h-11 text-[15px] cursor-pointer">
            <input type="checkbox" checked={dairyFree} onChange={(e) => setDairyFree(e.target.checked)} className="w-4 h-4 accent-brand" />
            Dairy-free
          </label>
          <Select
            aria-label="Sort by"
            value={sortBy}
            onValueChange={setSortBy}
            options={SORT_SELECT_OPTIONS}
            className="bg-brand text-cream border-brand hover:border-brand-dark"
            popupClassName="min-w-52"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Tea origin" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px]">
          <span className="text-subtle">Origin:</span>
          {[{ id: "all" as const, name: "Any" }, ...ORIGINS].map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={selectedOrigin === o.id}
              onClick={() => setSelectedOrigin(o.id)}
              className={`min-h-11 cursor-pointer hover:text-brand ${selectedOrigin === o.id ? "underline underline-offset-[6px]" : ""}`}
            >
              {o.name}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="flex items-center border-b border-ink w-full sm:w-72">
          <Search className="w-4 h-4 text-subtle shrink-0" strokeWidth={1.5} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the menu"
            aria-label="Search the menu"
            className="flex-1 min-w-0 bg-transparent px-2.5 py-2.5 text-base placeholder:text-subtle/80 focus:outline-none"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="p-2 text-subtle hover:text-ink cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      <p className="mt-6 text-sm text-subtle" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "drink" : "drinks"}
      </p>

      {pageItems.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {pageItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-line p-10 sm:p-16 text-center">
          <p className="font-display text-3xl font-light uppercase">Nothing matches that</p>
          <p className="mt-3 text-subtle max-w-md mx-auto">
            Try fewer filters, or call {SHOP.phone} and we&apos;ll tell you what&apos;s brewing today.
          </p>
          <button type="button" onClick={clearAll} className="mt-7 min-h-12 px-7 bg-brand text-cream hover:bg-brand-dark cursor-pointer">
            Clear filters
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => goToPage(current - 1)}
            disabled={current === 1}
            aria-label="Previous page"
            className="w-11 h-11 flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => goToPage(p)}
              aria-current={p === current ? "page" : undefined}
              className={`w-11 h-11 rounded-full cursor-pointer ${p === current ? "bg-brand text-cream" : "border border-line hover:border-ink"}`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goToPage(current + 1)}
            disabled={current === totalPages}
            aria-label="Next page"
            className="w-11 h-11 flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </nav>
      )}
    </div>
  );
}

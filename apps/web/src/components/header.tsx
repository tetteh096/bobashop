"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Search, X } from "lucide-react";
import { SHOP } from "@bobashop/api/data/shop";
import UserMenu from "./user-menu";
import { useFeatures } from "./features";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { useCart } from "./shop/cart-context";

const NAV_ITEMS = [
  { label: "menu", href: "/menu" },
  { label: "our teas", href: "/#origins" },
  { label: "how it's made", href: "/#process" },
  { label: "visit", href: "/contact" },
];

/** Basket icon from the reference: a trapezoid bag with a handle. */
export function BagIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M3 9h18l-2 11H5z" />
      <path d="M8 9l4-6 4 6" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { setIsCartOpen, totalItems, wishlist, searchQuery, setSearchQuery, setSelectedCategory, setSelectedOrigin } = useCart();

  const { accountsEnabled } = useFeatures();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuFocusSearch, setMenuFocusSearch] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const openMobileMenu = (focusSearch: boolean) => {
    setMenuFocusSearch(focusSearch);
    setMobileMenuOpen(true);
  };

  useEffect(() => setSearchOpen(false), [pathname]);
  useEffect(() => {
    if (!searchOpen) return;
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCategory("all");
    setSelectedOrigin("all");
    setSearchOpen(false);
    router.push("/menu");
  };

  const iconButton = "relative w-11 h-11 flex items-center justify-center hover:text-brand transition-colors cursor-pointer";

  return (
    <header id="top" className="sticky top-0 z-40 w-full bg-paper/95 backdrop-blur border-b border-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-[68px] lg:h-20 flex items-center gap-2 lg:gap-8">
        <button
          type="button"
          onClick={() => openMobileMenu(false)}
          className={`lg:hidden -ml-2 ${iconButton}`}
          aria-label="Open menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className="w-[22px] h-4">
            <path d="M0 1h22M0 8h22M0 15h22" />
          </svg>
        </button>

        <Link href="/" aria-label={`${SHOP.name} home`} className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center gap-9 mx-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href as "/"}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`text-[16px] transition-colors hover:text-brand ${
                isActive(item.href) ? "underline underline-offset-[6px] decoration-1" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 ml-auto lg:ml-0 shrink-0">
          <button
            type="button"
            onClick={() => (window.matchMedia("(min-width: 1024px)").matches ? setSearchOpen(true) : openMobileMenu(true))}
            aria-label="Search the menu"
            className={iconButton}
          >
            <Search className="w-5 h-5" strokeWidth={1.4} />
          </button>
          <Link href={"/wishlist" as "/"} aria-label={`Saved drinks, ${wishlist.length}`} className={`hidden sm:flex ${iconButton}`}>
            <Heart className="w-5 h-5" strokeWidth={1.4} />
            {wishlist.length > 0 && (
              <span className="absolute top-1.5 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-tomato text-white text-[11px] font-semibold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>
          {accountsEnabled && (
            <div className="hidden sm:block">
              <UserMenu />
            </div>
          )}
          <button type="button" onClick={() => setIsCartOpen(true)} aria-label={`Bag, ${totalItems} items`} className={iconButton}>
            <BagIcon />
            {totalItems > 0 && (
              <span className="absolute top-1.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-tomato text-white text-[11px] font-semibold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop search panel */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-full bg-paper border-b border-line shadow-[0_20px_40px_-28px_rgba(17,24,20,0.5)] animate-in fade-in slide-in-from-top-1 duration-150">
          <form onSubmit={submitSearch} className="max-w-3xl mx-auto px-6 py-6 flex items-center gap-4">
            <div className="flex-1 flex items-center h-14 border-b border-ink">
              <Search className="w-5 h-5 text-subtle shrink-0" strokeWidth={1.4} />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drinks, teas, toppings…"
                aria-label="Search the menu"
                className="flex-1 min-w-0 bg-transparent px-3 text-lg placeholder:text-subtle/80 focus:outline-none"
              />
            </div>
            <button type="submit" className="h-12 px-6 bg-tomato text-white hover:bg-tomato-dark cursor-pointer">
              Search
            </button>
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className={iconButton}>
              <X className="w-5 h-5" strokeWidth={1.4} />
            </button>
          </form>
        </div>
      )}

      <MobileMenu open={mobileMenuOpen} onClose={closeMobileMenu} items={NAV_ITEMS} focusSearch={menuFocusSearch} />
    </header>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Heart, MessageCircle, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import { CATEGORIES } from "@bobashop/api/data/catalog";
import { SHOP } from "@bobashop/api/data/shop";
import { useCart } from "./shop/cart-context";
import { Logo } from "./logo";
import { useFeatures } from "./features";
import { useSessionUser } from "./session-prefill";

export type NavItem = { label: string; href: string };

export function MobileMenu({
  open,
  onClose,
  items,
  focusSearch,
}: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  /** Opened from the search icon: put the cursor straight in the search box. */
  focusSearch: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { searchQuery, setSearchQuery, setSelectedCategory, setSelectedOrigin, totalItems, wishlist, setIsCartOpen } =
    useCart();
  const { accountsEnabled } = useFeatures();
  const searchRef = useRef<HTMLInputElement>(null);

  // Close whenever the page changes.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    if (focusSearch) setTimeout(() => searchRef.current?.focus(), 250);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, focusSearch, onClose]);

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  const goToCategory = (id: (typeof CATEGORIES)[number]["id"]) => {
    setSelectedOrigin("all");
    setSelectedCategory(id);
    onClose();
    router.push("/menu");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-x-0 top-0 h-dvh z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <m.div
            className="absolute inset-0 bg-night/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <m.nav
            className="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-paper flex flex-col shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-line shrink-0">
              <Logo />
              <button type="button" onClick={onClose} aria-label="Close menu" className="w-11 h-11 -mr-2 flex items-center justify-center hover:text-brand cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSelectedCategory("all");
                  setSelectedOrigin("all");
                  onClose();
                  router.push("/menu");
                }}
                className="px-4 pt-4"
              >
                <div className="flex items-center border-b border-ink px-1">
                  <Search className="w-5 h-5 text-subtle shrink-0" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Drinks, teas, toppings…"
                    aria-label="Search the menu"
                    enterKeyHint="search"
                    className="flex-1 min-w-0 bg-transparent px-3 py-3 text-base focus:outline-none"
                  />
                </div>
              </form>

              <ul className="px-2 pt-3">
                {items.map((item, i) => (
                  <m.li key={item.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.03 }}>
                    <Link
                      href={item.href as "/"}
                      onClick={onClose}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`flex items-center px-3 py-2.5 font-display text-2xl font-light uppercase tracking-[0.02em] ${
                        isActive(item.href) ? "text-brand" : "hover:text-brand"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </m.li>
                ))}
              </ul>

              <div className="px-4 pt-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">Browse</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => goToCategory(cat.id)}
                      className="rounded-full border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper cursor-pointer"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`grid ${accountsEnabled ? "grid-cols-3" : "grid-cols-2"} gap-2 px-4 pt-4 pb-4`}>
                <Link href={"/wishlist" as "/"} onClick={onClose} className="h-11 border border-line inline-flex items-center justify-center gap-1.5 text-sm font-medium">
                  <Heart className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">Saved{wishlist.length > 0 && ` ${wishlist.length}`}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsCartOpen(true);
                  }}
                  className="h-11 border border-line inline-flex items-center justify-center gap-1.5 text-sm font-medium cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">Bag{totalItems > 0 && ` ${totalItems}`}</span>
                </button>
                {accountsEnabled && <AccountLink onClose={onClose} />}
              </div>

              {/* Hints that the list scrolls on very short screens. */}
              <div aria-hidden className="sticky bottom-0 h-5 -mt-5 bg-gradient-to-t from-paper to-transparent pointer-events-none" />
            </div>

            <div className="shrink-0 grid grid-cols-2 gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-line">
              <a href={SHOP.telHref} className="inline-flex items-center justify-center gap-2 border border-ink font-medium py-3">
                <Phone className="w-4 h-4" /> Call
              </a>
              <a href={`https://wa.me/${SHOP.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-brand text-cream font-medium py-3">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </m.nav>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Only mounted when accounts are on, so prototype mode never asks for a session. */
function AccountLink({ onClose }: { onClose: () => void }) {
  const user = useSessionUser();
  return (
    <Link href={(user ? "/dashboard" : "/login") as "/"} onClick={onClose} className="h-11 border border-line inline-flex items-center justify-center gap-1.5 text-sm font-medium">
      <User className="w-4 h-4 shrink-0" />
      <span className="truncate">{user ? "Account" : "Sign in"}</span>
    </Link>
  );
}

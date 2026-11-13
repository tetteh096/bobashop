"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { ChevronRight, Heart, MessageCircle, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "./shop/cart-context";
import { Logo } from "./logo";
import { useFeatures } from "./features";
import { BranchButton, useBranch } from "./branch";
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
  const { searchQuery, setSearchQuery, setSelectedCategory, totalItems, wishlist, setIsCartOpen } =
    useCart();
  const { accountsEnabled } = useFeatures();
  const { contact } = useBranch();
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

  const browse = (food: boolean) => {
    setSelectedCategory("all");
    onClose();
    router.push((food ? "/menu?tab=food" : "/menu") as "/");
  };

  // The header blurs what's behind it, and a blurred element traps fixed-position children
  // inside its own box. Rendering into <body> lets the drawer cover the whole screen.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <m.div className="absolute inset-0 bg-night/60 backdrop-blur-[2px]" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <m.nav
            className="absolute inset-y-0 left-0 w-[88%] max-w-[380px] bg-paper flex flex-col shadow-2xl rounded-r-[28px] overflow-hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="flex items-center justify-between pl-4 pr-3 h-[72px] shrink-0">
              <Logo />
              <button type="button" onClick={onClose} aria-label="Close menu" className="w-11 h-11 rounded-full bg-tint hover:bg-tint-strong flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 flex flex-col gap-5">
              <BranchButton className="w-full justify-center min-h-12 text-base" />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSelectedCategory("all");
                  onClose();
                  router.push("/menu");
                }}
              >
                <label className="flex items-center h-12 rounded-full bg-card border border-line px-4 focus-within:border-brand">
                  <Search className="w-5 h-5 text-subtle shrink-0" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search drinks and food"
                    aria-label="Search the menu"
                    enterKeyHint="search"
                    className="flex-1 min-w-0 bg-transparent px-3 text-base focus:outline-none placeholder:text-subtle/80"
                  />
                </label>
              </form>

              {/* Drinks or food, as two picture tiles */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { food: false, title: "Drinks", text: "Milk tea, matcha, fruit tea", src: "/images/drinks/sweet-taro.webp" },
                  { food: true, title: "Food", text: "Wings, shawarma, rice", src: "/images/food-wings.jpg" },
                ].map((tile) => (
                  <button
                    key={tile.title}
                    type="button"
                    onClick={() => browse(tile.food)}
                    className="relative h-32 rounded-[20px] overflow-hidden text-left text-cream cursor-pointer"
                  >
                    <Image src={tile.src} alt="" fill sizes="180px" className="object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/30 to-transparent" />
                    <span className="absolute left-3 right-3 bottom-3">
                      <span className="block font-display text-xl font-bold leading-none">{tile.title}</span>
                      <span className="block mt-1 text-xs text-cream/80 leading-tight">{tile.text}</span>
                    </span>
                  </button>
                ))}
              </div>

              <ul className="rounded-[20px] bg-card border border-line divide-y divide-line overflow-hidden">
                {items.map((item, i) => (
                  <m.li key={item.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 + i * 0.03 }}>
                    <Link
                      href={item.href as "/"}
                      onClick={onClose}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`flex items-center justify-between min-h-14 px-4 font-display text-xl font-semibold ${
                        isActive(item.href) ? "text-brand" : "hover:text-brand"
                      }`}
                    >
                      {item.label}
                      <ChevronRight className="w-5 h-5 text-subtle" />
                    </Link>
                  </m.li>
                ))}
              </ul>

              <div className={`grid ${accountsEnabled ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
                <Link href={"/wishlist" as "/"} onClick={onClose} className={quick}>
                  <Heart className="w-5 h-5" strokeWidth={1.75} />
                  Saved
                  {wishlist.length > 0 && <Count n={wishlist.length} />}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsCartOpen(true);
                  }}
                  className={`${quick} cursor-pointer`}
                >
                  <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
                  Bag
                  {totalItems > 0 && <Count n={totalItems} />}
                </button>
                {accountsEnabled && <AccountLink onClose={onClose} />}
              </div>
            </div>

            <div className="shrink-0 grid grid-cols-2 gap-2 px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-line bg-paper">
              <a href={contact.telHref} className="min-h-12 rounded-full border border-ink/25 hover:border-ink inline-flex items-center justify-center gap-2 font-medium">
                <Phone className="w-4 h-4" /> Call
              </a>
              <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="min-h-12 rounded-full bg-gold text-ink hover:bg-[#f39c0a] inline-flex items-center justify-center gap-2 font-semibold">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </m.nav>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

const quick =
  "relative min-h-[72px] rounded-[18px] bg-card border border-line hover:border-brand/40 flex flex-col items-center justify-center gap-1 text-sm font-medium";

function Count({ n }: { n: number }) {
  return (
    <span className="absolute top-2 right-2 min-w-5 h-5 px-1 rounded-full bg-tomato text-white text-[11px] font-semibold flex items-center justify-center">{n}</span>
  );
}

/** Only mounted when accounts are on, so prototype mode never asks for a session. */
function AccountLink({ onClose }: { onClose: () => void }) {
  const user = useSessionUser();
  return (
    <Link href={(user ? "/dashboard" : "/login") as "/"} onClick={onClose} className={quick}>
      <User className="w-5 h-5" strokeWidth={1.75} />
      <span className="truncate">{user ? "Account" : "Sign in"}</span>
    </Link>
  );
}

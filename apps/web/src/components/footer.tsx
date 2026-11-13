"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, MessageCircle, Phone } from "lucide-react";
import { DRINK_CATEGORIES as CATEGORIES, type CategoryId } from "@bobashop/api/data/catalog";
import { BRANCHES, SHOP } from "@bobashop/api/data/shop";
import { useBranch } from "./branch";
import { useCart } from "./shop/cart-context";
import { Logo } from "./logo";
import { useFeatures } from "./features";

const PAYMENT_METHODS = ["Visa", "Mastercard", "MTN MoMo", "Telecel Cash", "AirtelTigo Money"];

export default function Footer() {
  const router = useRouter();
  const { setSelectedCategory } = useCart();
  const { contact, setBranchId } = useBranch();
  const { accountsEnabled } = useFeatures();

  const browse = (category: CategoryId) => {
    setSelectedCategory(category);
    router.push("/menu");
  };

  return (
    <footer className="mt-auto bg-night text-cream">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-8 grid grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.4fr] gap-x-6 gap-y-8 lg:gap-10">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" aria-label={`${SHOP.name} home`}>
            <Logo inverted />
          </Link>
          <p className="mt-4 text-sm sm:text-[15px] text-cream/70 leading-relaxed max-w-sm">{SHOP.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={contact.telHref} className="inline-flex items-center gap-2 rounded-full border border-cream/40 hover:border-cream px-4 py-2.5 text-sm">
              <Phone className="w-4 h-4" strokeWidth={1.5} /> Call
            </a>
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gold text-ink hover:bg-gold/90 px-4 py-2.5 text-sm font-medium">
              <MessageCircle className="w-4 h-4" strokeWidth={1.5} /> WhatsApp
            </a>
          </div>
        </div>

        <FooterColumn title="Menu">
          {CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <button type="button" onClick={() => browse(cat.id)} className="hover:text-cream text-left cursor-pointer">
                {cat.name}
              </button>
            </li>
          ))}
          <li>
            <Link href={"/menu?tab=food" as "/"} className="hover:text-cream">
              Food menu
            </Link>
          </li>
        </FooterColumn>

        <FooterColumn title={SHOP.name}>
          <li><Link href={"/contact" as "/"} className="hover:text-cream">Contact us</Link></li>
          <li>
            <a href={SHOP.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-cream">
              <Camera className="w-4 h-4" strokeWidth={1.5} /> {SHOP.instagramHandle}
            </a>
          </li>
          <li><Link href={"/wishlist" as "/"} className="hover:text-cream">Saved</Link></li>
          {accountsEnabled && <li><Link href={"/dashboard" as "/"} className="hover:text-cream">Your account</Link></li>}
        </FooterColumn>

        <FooterColumn title="Our branches" className="col-span-2 lg:col-span-1" listClassName="grid grid-cols-2 gap-x-6 gap-y-3 space-y-0">
          {BRANCHES.map((b) => (
            <li key={b.id} className="min-w-0">
              <button type="button" onClick={() => setBranchId(b.id)} className="block text-cream hover:text-gold cursor-pointer text-left truncate max-w-full">
                {b.name}
              </button>
              <a href={b.telHref} className="block text-[13px] text-cream/60 hover:text-cream">
                {b.phone}
              </a>
            </li>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t border-cream/15">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-5 flex flex-col-reverse md:flex-row items-center justify-between gap-3 text-[13px] text-cream/60">
          <p>© {new Date().getFullYear()} {SHOP.legalName}</p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1" aria-label="Payment methods we accept">
            {PAYMENT_METHODS.map((method) => (
              <li key={method}>{method}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
  className = "",
  listClassName = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  listClassName?: string;
}) {
  return (
    <div className={className}>
      <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-gold">{title}</p>
      <ul className={`mt-3.5 space-y-2.5 text-[15px] text-cream/70 ${listClassName}`}>{children}</ul>
    </div>
  );
}

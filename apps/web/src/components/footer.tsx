"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { CATEGORIES, type CategoryId } from "@bobashop/api/data/catalog";
import { SHOP } from "@bobashop/api/data/shop";
import { useCart } from "./shop/cart-context";
import { Logo } from "./logo";
import { useFeatures } from "./features";

const PAYMENT_METHODS = ["Visa", "Mastercard", "MTN MoMo", "Telecel Cash", "AirtelTigo Money"];

export default function Footer() {
  const router = useRouter();
  const { setSelectedCategory, setSelectedOrigin } = useCart();
  const { accountsEnabled } = useFeatures();

  const browse = (category: CategoryId) => {
    setSelectedOrigin("all");
    setSelectedCategory(category);
    router.push("/menu");
  };

  return (
    <footer className="mt-auto bg-night text-cream">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10">
        <div>
          <Link href="/" aria-label={`${SHOP.name} home`}>
            <Logo inverted />
          </Link>
          <p className="mt-5 text-[15px] text-cream/70 leading-relaxed max-w-xs">{SHOP.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={SHOP.telHref} className="inline-flex items-center gap-2 border border-cream/40 hover:border-cream px-4 py-2.5 text-sm">
              <Phone className="w-4 h-4" strokeWidth={1.5} /> Call
            </a>
            <a href={`https://wa.me/${SHOP.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark px-4 py-2.5 text-sm">
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
            <Link href="/menu" className="hover:text-cream">
              Everything
            </Link>
          </li>
        </FooterColumn>

        <FooterColumn title={SHOP.name}>
          <li><Link href={"/#origins" as "/"} className="hover:text-cream">Our teas</Link></li>
          <li><Link href={"/#process" as "/"} className="hover:text-cream">How it&apos;s made</Link></li>
          <li><Link href={"/wishlist" as "/"} className="hover:text-cream">Saved drinks</Link></li>
          {accountsEnabled && <li><Link href={"/dashboard" as "/"} className="hover:text-cream">Your account</Link></li>}
        </FooterColumn>

        <FooterColumn title="Visit">
          <li className="flex gap-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>{SHOP.address}</span>
          </li>
          {SHOP.hours.map((h) => (
            <li key={h.days} className="flex justify-between gap-3 text-[13px]">
              <span>{h.days}</span>
              <span className="text-cream/60">{h.time}</span>
            </li>
          ))}
          <li>
            <a href={`mailto:${SHOP.email}`} className="inline-flex items-center gap-2 hover:text-cream break-all">
              <Mail className="w-4 h-4 shrink-0" strokeWidth={1.5} /> {SHOP.email}
            </a>
          </li>
        </FooterColumn>
      </div>

      <div className="border-t border-cream/15">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-6 flex flex-col-reverse md:flex-row items-center justify-between gap-4 text-[13px] text-cream/60">
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

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-sm font-normal uppercase tracking-[0.14em] text-cream">{title}</p>
      <ul className="mt-5 space-y-3 text-[15px] text-cream/70">{children}</ul>
    </div>
  );
}

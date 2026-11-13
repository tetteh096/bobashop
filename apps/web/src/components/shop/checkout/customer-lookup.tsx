"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MapPin, Search, Store, UserRound, X } from "lucide-react";
import type { CustomerProfile } from "@bobashop/api/customers";
import { findBranch } from "@bobashop/api/data/shop";
import { useTRPC } from "@/utils/trpc";

/** "024 *** 4567", so the confirm step doesn't show someone else's full number. */
function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length >= 7 ? `${d.slice(0, 3)} *** ${d.slice(-4)}` : phone;
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return user && domain ? `${user[0]}${"*".repeat(Math.max(2, user.length - 1))}@${domain}` : email;
}

/**
 * "Ordered before?" Type a phone number or email; if we know them, show a masked summary
 * to confirm, then fill in checkout with their saved details.
 */
export function CustomerLookup({ onUse, used }: { onUse: (profile: CustomerProfile) => void; used: boolean }) {
  const trpc = useTRPC();
  const lookup = useMutation(trpc.customers.lookup.mutationOptions());
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<CustomerProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || used) return null;

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotFound(false);
    setFound(null);
    if (query.trim().length < 3) return;
    try {
      const result = await lookup.mutateAsync({ query: query.trim() });
      if (result.profile) setFound(result.profile);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    }
  };

  if (found) {
    const lastBranch = findBranch(found.branchId);
    return (
      <div className="rounded-[24px] border-2 border-brand bg-gold-soft p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Welcome back</p>
        <p className="mt-1 font-display text-2xl sm:text-3xl font-bold">Hi {found.fullName.split(" ")[0]}! Is this you?</p>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[15px]">
          <div className="flex items-center gap-2">
            <UserRound className="w-4 h-4 text-brand shrink-0" />
            <span>
              {found.fullName} · {maskPhone(found.phone)}
            </span>
          </div>
          <div className="text-subtle sm:text-ink truncate">{maskEmail(found.email)}</div>
          <div className="flex items-center gap-2 sm:col-span-2">
            {found.method === "delivery" ? <MapPin className="w-4 h-4 text-brand shrink-0" /> : <Store className="w-4 h-4 text-brand shrink-0" />}
            <span className="truncate">
              {found.method === "delivery" && found.address
                ? `Delivery to ${found.address.split(",").slice(0, 2).join(",")}`
                : `Pickup${lastBranch ? ` at ${lastBranch.name}` : ""}`}
            </span>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onUse(found)}
            className="min-h-12 px-6 rounded-full bg-brand-deep text-cream hover:bg-night font-medium cursor-pointer"
          >
            Yes, use my details
          </button>
          <button
            type="button"
            onClick={() => {
              setFound(null);
              setQuery("");
            }}
            className="min-h-12 px-5 rounded-full border border-ink/25 hover:border-ink font-medium cursor-pointer"
          >
            Not me
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={search} className="relative rounded-[24px] bg-brand-deep text-cream p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Skip"
        className="absolute right-3 top-3 w-10 h-10 rounded-full hover:bg-cream/10 flex items-center justify-center cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="font-display text-2xl font-bold pr-10">Ordered with us before?</p>
      <p className="mt-1 text-cream/75 text-[15px]">Enter your phone number or email and we&apos;ll fill in your details.</p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
        <label className="w-full sm:flex-1 shrink-0 flex items-center h-13 min-h-13 rounded-full bg-paper text-ink pl-4 pr-2">
          <Search className="w-4 h-4 text-subtle shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode="email"
            autoComplete="tel"
            placeholder="024 123 4567 or you@email.com"
            aria-label="Phone number or email"
            className="flex-1 min-w-0 bg-transparent px-3 text-base focus:outline-none placeholder:text-subtle/80"
          />
        </label>
        <button
          type="submit"
          disabled={lookup.isPending || query.trim().length < 3}
          className="shrink-0 h-13 px-7 rounded-full bg-gold text-ink hover:bg-[#f39c0a] font-semibold disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-2"
        >
          {lookup.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Find me
        </button>
      </div>
      {notFound && (
        <p className="mt-3 text-[15px] text-cream/85">
          We don&apos;t have details for that yet. Fill them in below and we&apos;ll remember you next time.
        </p>
      )}
    </form>
  );
}

"use client";

import { ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Orders", icon: ClipboardList },
  { href: "/admin/staff", label: "Staff", icon: Users },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1" aria-label="Admin">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active ? "bg-brand-deep text-cream" : "text-ink hover:bg-tint"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Signed in, but not as shop staff. */
export function NotAdmin({ email }: { email: string }) {
  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <h1 className="font-display text-3xl">Staff only</h1>
      <p className="mt-4 text-subtle leading-relaxed">
        You&apos;re signed in as <strong className="text-ink">{email}</strong>, which isn&apos;t a shop admin account.
        Ask an admin to add you under Staff, then sign in again.
      </p>
      <Link href="/" className="mt-8 inline-flex items-center rounded-full bg-brand-deep text-cream font-semibold px-6 py-3">
        Back to the shop
      </Link>
    </div>
  );
}

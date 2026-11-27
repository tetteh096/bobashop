"use client";

import { BarChart3, ClipboardList, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

const LINKS = [
  { href: "/admin", label: "Orders", icon: ClipboardList },
  { href: "/admin/summary", label: "Daily summary", icon: BarChart3 },
  { href: "/admin/staff", label: "Staff", icon: Users },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Admin">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active ? "bg-cream text-brand-deep" : "text-cream/85 hover:bg-cream/10 hover:text-cream"
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

/** Who is signed in, with a way out. */
export function AdminAccount() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  if (!session) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="hidden md:inline text-sm text-cream/80 max-w-[200px] truncate" title={session.user.email}>
        {session.user.email}
      </span>
      <button
        type="button"
        onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/login?next=/admin") } })}
        className="inline-flex items-center gap-1.5 rounded-full border border-cream/30 px-3 py-1.5 text-sm font-semibold hover:bg-cream/10 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
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

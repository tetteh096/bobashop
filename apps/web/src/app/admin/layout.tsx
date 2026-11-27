import type { Metadata } from "next";
import Link from "next/link";

import { AdminAccount, AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: "Admin | Bobalicious",
  robots: { index: false, follow: false },
};

/** The back office: its own top bar, none of the shop's header, footer or bag. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="sticky top-0 z-40 bg-brand-deep text-cream print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 flex items-center gap-6">
          <Link href="/admin" className="font-display text-xl shrink-0 hidden sm:block">
            Bobalicious <span className="text-gold text-sm font-sans font-semibold uppercase tracking-wider">Admin</span>
          </Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" className="hidden sm:inline text-sm font-semibold text-cream/80 hover:text-cream">
              View shop ↗
            </Link>
            <AdminAccount />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-8 print:p-0 print:max-w-none">{children}</main>
    </div>
  );
}

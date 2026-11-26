import type { Metadata } from "next";

import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: "Admin | Bobalicious",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 mb-6">
        <p className="font-display text-xl">
          Bobalicious <span className="text-subtle font-sans text-sm font-semibold uppercase tracking-wider">Admin</span>
        </p>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}

import Link from "next/link";
import { SHOP } from "@bobashop/api/data/shop";
import LoginPanel from "@/components/login-panel";
import { accountsEnabled } from "@/features";

export default function LoginPage() {
  if (accountsEnabled) return <LoginPanel />;

  // Prototype mode: no database, so there's nothing to sign in to yet.
  return (
    <div className="relative isolate overflow-hidden">
    <div className="max-w-xl mx-auto px-5 py-24 text-center">
      <h1 className="font-display text-4xl sm:text-5xl font-light uppercase">Accounts are coming soon</h1>
      <p className="mt-5 text-lg text-subtle leading-relaxed">
        You don&apos;t need one to order. Add drinks to your bag and check out as a guest, or call {SHOP.phone}.
      </p>
      <Link href="/menu" className="mt-8 inline-flex items-center min-h-13 px-7 bg-tomato hover:bg-tomato-dark text-white">
        See the menu
      </Link>
    </div>
    </div>
  );
}

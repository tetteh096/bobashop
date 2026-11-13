import type { Metadata } from "next";
import { Fredoka, Inter_Tight } from "next/font/google";
import { SHOP } from "@bobashop/api/data/shop";

import "../index.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Providers from "@/components/providers";
import { accountsEnabled } from "@/features";

// Rounded and chunky, close to the Bobalicious logo lettering.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: `${SHOP.legalName} | Boba, pizza & good vibes`,
  description: SHOP.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fredoka.variable} ${interTight.variable} antialiased bg-paper text-ink min-h-screen flex flex-col`}>
        <Providers accountsEnabled={accountsEnabled}>
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

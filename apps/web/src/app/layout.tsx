import type { Metadata } from "next";
import { Inter_Tight, Jost } from "next/font/google";
import { SHOP } from "@bobashop/api/data/shop";

import "../index.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Providers from "@/components/providers";
import { accountsEnabled } from "@/features";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: `${SHOP.legalName} | Real tea boba`,
  description: SHOP.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jost.variable} ${interTight.variable} antialiased bg-paper text-ink min-h-screen flex flex-col`}>
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

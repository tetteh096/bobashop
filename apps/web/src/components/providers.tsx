"use client";

import { Toaster } from "@bobashop/ui/components/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { getQueryClient, makeTRPCClient, TRPCProvider } from "@/utils/trpc";

import { ThemeProvider } from "./theme-provider";
import { CartProvider } from "./shop/cart-context";
import { FeaturesProvider } from "./features";

// The drawer only renders once opened, so its code can load after the page.
const CartDrawer = dynamic(() => import("./shop/cart-drawer").then((mod) => mod.CartDrawer), {
  ssr: false,
});

export default function Providers({ children, accountsEnabled }: { children: React.ReactNode; accountsEnabled: boolean }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(makeTRPCClient);

  return (
    <FeaturesProvider value={{ accountsEnabled }}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {/* Visitors who ask their device for less motion get instant transitions. */}
          <MotionConfig reducedMotion="user">
            <LazyMotion features={domAnimation} strict>
              <CartProvider>
                {children}
                <CartDrawer />
              </CartProvider>
            </LazyMotion>
          </MotionConfig>
        </TRPCProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
    </FeaturesProvider>
  );
}

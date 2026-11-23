"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Category, Product } from "@bobashop/api/data/catalog";
import { useTRPC } from "@/utils/trpc";
import { useBranch } from "../branch";

interface MenuContextType {
  /** Today's menu from the branch's POS. Empty until it loads. */
  products: Product[];
  categories: Category[];
  /** The branch this menu is from: the chosen one, or the default before one is chosen. */
  menuBranchId: string | undefined;
  /** True until the first menu arrives. */
  loading: boolean;
  /** The menu didn't load and there's nothing older to show. */
  failed: boolean;
  findProduct: (id: string) => Product | undefined;
}

const MenuContext = createContext<MenuContextType | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC();
  const { branch, branchesLoading } = useBranch();
  const { data, isPending, isError } = useQuery(
    trpc.menu.forBranch.queryOptions(
      { branchId: branch?.id },
      {
        // Wait for the saved branch, so a returning customer doesn't load the default menu first.
        enabled: !branchesLoading,
        staleTime: 15_000,
        // Prices, stock and sizes change in the POS; keep an open menu close to it.
        refetchInterval: 60_000,
        // Switching branch keeps the old menu on screen until the new one arrives.
        placeholderData: keepPreviousData,
      }
    )
  );

  const products = useMemo(() => data?.products ?? [], [data]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const findProduct = useCallback((id: string) => byId.get(id), [byId]);

  const value = useMemo<MenuContextType>(
    () => ({
      products,
      categories: data?.categories ?? [],
      menuBranchId: data?.branchId,
      loading: isPending,
      failed: isError && !data,
      findProduct,
    }),
    [products, data, isPending, isError, findProduct]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used inside MenuProvider");
  return ctx;
}

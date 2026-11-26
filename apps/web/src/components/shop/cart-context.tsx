"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MAX_QUANTITY_PER_ITEM, type DiscountRule, type FulfilmentMethod } from "@bobashop/api/pricing";
import { useTRPCClient } from "@/utils/trpc";
import { useBranch } from "../branch";
import { useMenu } from "./menu-context";
import {
  defaultOptions,
  describeOptions,
  normaliseOptions,
  optionsProblem,
  unitPrice,
  type ItemOptions,
  type Product,
} from "@bobashop/api/data/catalog";
import { formatGHS } from "./money";

export interface CartItem {
  /** Item id plus its options, so two differently made cups are separate lines. */
  key: string;
  product: Product;
  options: ItemOptions;
  /** Price of one with these options, from the branch's menu as it is now. */
  unitPrice: number;
  quantity: number;
}

export type CategoryFilter = string;

interface CartContextType {
  items: CartItem[];
  /** Without options, the drink goes in the way it comes (regular, 50% sweet, less ice). */
  addToCart: (product: Product, options?: { options?: ItemOptions; quantity?: number }) => void;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
  wishlist: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
  moveToWishlist: (key: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: CategoryFilter;
  setSelectedCategory: (category: CategoryFilter) => void;
  /** Delivery or pickup, chosen in the cart or at checkout and remembered between visits. */
  fulfilment: FulfilmentMethod;
  setFulfilment: (method: FulfilmentMethod) => void;
  /** A code the server has accepted; the server re-applies it when the order is placed. */
  discount: DiscountRule | null;
  setDiscount: (rule: DiscountRule | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "boba-bag";
const WISHLIST_KEY = "boba-saved";
const DISCOUNT_KEY = "boba-discount";
const FULFILMENT_KEY = "boba-fulfilment";

type StoredLine = { key: string; id: string; options: ItemOptions; quantity: number };

export function lineKey(productId: string, options: ItemOptions) {
  return `${productId}::${JSON.stringify(normaliseOptions(options))}`;
}

function storedLine(id: string, options: ItemOptions, quantity: number): StoredLine {
  const normalised = normaliseOptions(options);
  return { key: lineKey(id, normalised), id, options: normalised, quantity };
}

/** Older bags stored drink options as size/sweetness/ice/toppings; those lines are dropped. */
function isStoredLine(x: unknown): x is Omit<StoredLine, "key"> {
  const l = x as StoredLine;
  return Boolean(l && typeof l.id === "string" && l.options && typeof l.options.choices === "object" && l.quantity > 0);
}

// Only ids, options and quantities are stored, so prices always come from the branch's menu.
function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, quota); the cart still works in memory.
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<StoredLine[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>("pickup");
  const [discount, setDiscount] = useState<DiscountRule | null>(null);
  const trpcClient = useTRPCClient();
  const { branch } = useBranch();
  const { findProduct, products, menuBranchId, loading: menuLoading } = useMenu();

  useEffect(() => {
    const stored = readStored<unknown[]>(CART_KEY, []);
    setLines((Array.isArray(stored) ? stored : []).filter(isStoredLine).map((l) => storedLine(l.id, l.options, l.quantity)));
    setWishlistIds(readStored<string[]>(WISHLIST_KEY, []).filter((id) => typeof id === "string"));
    setFulfilment(readStored<string>(FULFILMENT_KEY, "pickup") === "delivery" ? "delivery" : "pickup");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStored(
      CART_KEY,
      lines.map(({ id, options, quantity }) => ({ id, options, quantity }))
    );
  }, [lines, hydrated]);

  // Each line priced from the menu on screen. Lines it can't make wait here until the
  // branch's own menu has loaded, and are then taken out below.
  const items = useMemo(
    () =>
      lines.flatMap((line): CartItem[] => {
        const product = findProduct(line.id);
        if (!product || optionsProblem(product, line.options)) return [];
        return [{ key: line.key, product, options: line.options, unitPrice: unitPrice(product, line.options), quantity: line.quantity }];
      }),
    [lines, findProduct]
  );

  useEffect(() => {
    if (!hydrated) return;
    writeStored(WISHLIST_KEY, wishlistIds);
  }, [wishlistIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeStored(FULFILMENT_KEY, fulfilment);
  }, [fulfilment, hydrated]);

  // Only the code is stored; it's checked again on each visit so expired codes drop off.
  useEffect(() => {
    const code = readStored<string>(DISCOUNT_KEY, "");
    if (!code) return;
    trpcClient.discounts.check
      .mutate({ code })
      .then(setDiscount)
      .catch(() => writeStored(DISCOUNT_KEY, ""));
  }, [trpcClient]);

  useEffect(() => {
    if (!hydrated) return;
    writeStored(DISCOUNT_KEY, discount?.code ?? "");
  }, [discount, hydrated]);

  // Once the branch's menu is in, take out what it doesn't make today (or not in that size)
  // and say what went. Prices of what stays follow the menu by themselves.
  const menuIsCurrent = hydrated && !menuLoading && products.length > 0 && (!branch || menuBranchId === branch.id);
  useEffect(() => {
    if (!menuIsCurrent) return;
    const gone = lines.filter((line) => {
      const product = findProduct(line.id);
      return !product || optionsProblem(product, line.options);
    });
    if (gone.length === 0) return;
    setLines((prev) => prev.filter((line) => !gone.includes(line)));
    const where = branch?.name ?? "This branch";
    toast(`${gone.length === 1 ? "An item was" : `${gone.length} items were`} removed from your bag`, {
      description: `${where} isn't serving ${gone.length === 1 ? "it" : "them"} today, or not in the size you chose.`,
    });
  }, [menuIsCurrent, lines, findProduct, branch]);

  const addToCart: CartContextType["addToCart"] = (product, { options, quantity = 1 } = {}) => {
    if (!product.inStock) {
      toast(`${product.name} is sold out`, { description: "Try another branch, or something else from the menu." });
      return;
    }
    const line = storedLine(product.id, options ?? defaultOptions(product), quantity);
    setLines((prev) => {
      if (prev.some((l) => l.key === line.key)) {
        return prev.map((l) => (l.key === line.key ? { ...l, quantity: Math.min(MAX_QUANTITY_PER_ITEM, l.quantity + quantity) } : l));
      }
      return [...prev, line];
    });

    toast.success("Added to your bag", {
      description: [product.name, describeOptions(line.options, product), formatGHS(unitPrice(product, line.options))].filter(Boolean).join(" · "),
      action: { label: "View bag", onClick: () => setIsCartOpen(true) },
    });
  };

  const removeFromCart = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY_PER_ITEM, quantity) } : l)));
  };

  const clearCart = () => {
    setLines([]);
    setDiscount(null);
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = (product: Product) => {
    const saved = isInWishlist(product.id);
    setWishlistIds((prev) =>
      saved ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
    toast(saved ? "Removed from saved" : "Saved for later", { description: product.name });
  };

  const clearWishlist = () => {
    setWishlistIds([]);
    toast("Saved list cleared");
  };

  const moveToWishlist = (key: string) => {
    const item = items.find((i) => i.key === key);
    if (!item) return;
    setWishlistIds((prev) => (prev.includes(item.product.id) ? prev : [...prev, item.product.id]));
    removeFromCart(key);
  };

  const wishlist = wishlistIds.flatMap((id) => {
    const product = findProduct(id);
    return product ? [product] : [];
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        subtotal,
        wishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        moveToWishlist,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        fulfilment,
        setFulfilment,
        discount,
        setDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

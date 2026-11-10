"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { FREE_DELIVERY_THRESHOLD, MAX_QUANTITY_PER_ITEM, type DiscountRule, type FulfilmentMethod } from "@bobashop/api/pricing";
import { useTRPCClient } from "@/utils/trpc";
import {
  defaultOptions,
  describeOptions,
  findProduct,
  normaliseOptions,
  optionsProblem,
  unitPrice,
  type CategoryId,
  type DrinkOptions,
  type OriginId,
  type Product,
} from "@bobashop/api/data/catalog";
import { formatGHS } from "./money";

export interface CartItem {
  /** Drink id plus its options, so two differently made cups are separate lines. */
  key: string;
  product: Product;
  options: DrinkOptions;
  /** Price of one cup with these options, from the current menu. */
  unitPrice: number;
  quantity: number;
}

export type CategoryFilter = CategoryId | "all";
export type OriginFilter = OriginId | "all";

interface CartContextType {
  items: CartItem[];
  /** Without options, the drink goes in the way it comes (regular, 50% sweet, less ice). */
  addToCart: (product: Product, options?: { options?: DrinkOptions; quantity?: number }) => void;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  wishlist: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  moveToWishlist: (key: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: CategoryFilter;
  setSelectedCategory: (category: CategoryFilter) => void;
  selectedOrigin: OriginFilter;
  setSelectedOrigin: (origin: OriginFilter) => void;
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

type StoredLine = { id: string; options: DrinkOptions; quantity: number };

export function lineKey(productId: string, options: DrinkOptions) {
  const o = normaliseOptions(options);
  return `${productId}::${o.size}:${o.sweetness}:${o.ice}:${o.toppings.join("+")}`;
}

function makeLine(product: Product, options: DrinkOptions, quantity: number): CartItem {
  const normalised = normaliseOptions(options);
  return {
    key: lineKey(product.id, normalised),
    product,
    options: normalised,
    unitPrice: unitPrice(product, normalised),
    quantity,
  };
}

// Only ids, options and quantities are stored, so prices always come from the current menu.
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
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedOrigin, setSelectedOrigin] = useState<OriginFilter>("all");
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>("pickup");
  const [discount, setDiscount] = useState<DiscountRule | null>(null);
  const trpcClient = useTRPCClient();

  useEffect(() => {
    const stored = readStored<StoredLine[]>(CART_KEY, []);
    setItems(
      stored.flatMap(({ id, options, quantity }) => {
        const product = findProduct(id);
        if (!product || !options || quantity <= 0) return [];
        // Drop lines the menu can no longer make (a topping removed, a drink no longer served hot).
        if (optionsProblem(product, normaliseOptions(options))) return [];
        return [makeLine(product, options, quantity)];
      })
    );
    setWishlistIds(readStored<string[]>(WISHLIST_KEY, []).filter((id) => findProduct(id)));
    setFulfilment(readStored<string>(FULFILMENT_KEY, "pickup") === "delivery" ? "delivery" : "pickup");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStored(
      CART_KEY,
      items.map((item): StoredLine => ({ id: item.product.id, options: item.options, quantity: item.quantity }))
    );
  }, [items, hydrated]);

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

  const addToCart: CartContextType["addToCart"] = (product, { options, quantity = 1 } = {}) => {
    const line = makeLine(product, options ?? defaultOptions(product), quantity);
    setItems((prev) => {
      if (prev.some((item) => item.key === line.key)) {
        return prev.map((item) =>
          item.key === line.key ? { ...item, quantity: Math.min(MAX_QUANTITY_PER_ITEM, item.quantity + quantity) } : item
        );
      }
      return [...prev, line];
    });

    toast.success("Added to your bag", {
      description: `${product.name} · ${describeOptions(line.options)} · ${formatGHS(line.unitPrice)}`,
      action: { label: "View bag", onClick: () => setIsCartOpen(true) },
    });
  };

  const removeFromCart = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, quantity } : item)));
  };

  const clearCart = () => {
    setItems([]);
    setDiscount(null);
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = (product: Product) => {
    const saved = isInWishlist(product.id);
    setWishlistIds((prev) =>
      saved ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
    toast(saved ? "Removed from saved drinks" : "Saved for later", { description: product.name });
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
  const freeShippingRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

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
        freeShippingThreshold: FREE_DELIVERY_THRESHOLD,
        freeShippingRemaining,
        wishlist,
        isInWishlist,
        toggleWishlist,
        moveToWishlist,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedOrigin,
        setSelectedOrigin,
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

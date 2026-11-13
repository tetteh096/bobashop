"use client";

import React from "react";
import { computeTotals, type FulfilmentMethod } from "@bobashop/api/pricing";
import { describeOptions } from "@bobashop/api/data/catalog";
import { useCart } from "./cart-context";
import { ProductArt } from "./product-art";
import { DiscountCodeField } from "./discount-code-field";
import { formatGHS } from "./money";
import { lowestDeliveryFee } from "@bobashop/api/branch-menu";
import { useBranch } from "../branch";

/** Same calculation the server uses to charge, so the total shown is the total paid. */
export function useOrderTotals(method: FulfilmentMethod, distanceFee: number | null = null) {
  const { subtotal, discount } = useCart();
  return computeTotals(subtotal, method, discount, distanceFee);
}

export function OrderSummary({
  method,
  distanceFee = null,
  showItems = false,
  before,
  children,
}: {
  method: FulfilmentMethod;
  /** The delivery quote for the customer's pin; null until they set one. */
  distanceFee?: number | null;
  showItems?: boolean;
  /** Shown under the heading, above the totals (e.g. the delivery/pickup switch). */
  before?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { items, totalItems, freeShippingRemaining, discount: rule } = useCart();
  const { subtotal, deliveryFee, deliveryPending, discount, total, discountShortfall } = useOrderTotals(method, distanceFee);
  const { branch } = useBranch();
  const fromFee = lowestDeliveryFee(branch);

  // Why an accepted code isn't taking anything off right now.
  const codeNote =
    rule && discount === 0
      ? discountShortfall > 0
        ? `Add ${formatGHS(discountShortfall)} more to use ${rule.code}.`
        : rule.kind === "free_delivery"
          ? method === "pickup"
            ? `${rule.code} is for delivery; pickup is already free.`
            : "Delivery is already free on this order."
          : null
      : null;

  return (
    <div className="bg-card border border-line p-6 sm:p-7">
      <p className="font-display text-xl font-normal text-ink">Order summary</p>
      {before && <div className="mt-4">{before}</div>}

      {showItems && (
        <ul className="mt-5 space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map(({ key, product, options, unitPrice, quantity }) => (
            <li key={key} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <ProductArt product={product} className="w-12 h-12 " />
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-ink text-white text-xs font-semibold flex items-center justify-center">
                  {quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                <p className="text-xs text-subtle line-clamp-2">{describeOptions(options, product)}</p>
              </div>
              <span className="text-sm font-semibold shrink-0">{formatGHS(unitPrice * quantity)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <DiscountCodeField />
      </div>

      <dl className="mt-6 space-y-3">
        <div className="flex justify-between">
          <dt className="text-subtle">Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</dt>
          <dd className="font-semibold">{formatGHS(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-subtle">{method === "pickup" ? "Shop pickup" : "Delivery"}</dt>
          <dd className={`font-semibold text-right ${deliveryFee === 0 && !deliveryPending ? "text-[#2C6853]" : ""}`}>
            {deliveryPending ? (
              <span className="text-sm font-medium text-subtle">{fromFee !== null ? `From ${formatGHS(fromFee)}, by distance` : "Set at checkout"}</span>
            ) : deliveryFee === 0 ? (
              "Free"
            ) : (
              formatGHS(deliveryFee)
            )}
          </dd>
        </div>
        {discount > 0 && rule && (
          <div className="flex justify-between">
            <dt className="text-subtle">
              Discount <span className="font-mono text-xs font-semibold text-ink">{rule.code}</span>
            </dt>
            <dd className="font-semibold text-[#2C6853]">−{formatGHS(discount)}</dd>
          </div>
        )}
        {codeNote && <p className="text-sm text-ink/80 bg-gold-soft px-3 py-2">{codeNote}</p>}
        {method === "delivery" && freeShippingRemaining > 0 && rule?.kind !== "free_delivery" && (
          <p className="text-sm text-brand bg-tint px-3 py-2">
            Add {formatGHS(freeShippingRemaining)} more for free delivery.
          </p>
        )}
        <div className="pt-4 border-t border-line flex justify-between items-baseline">
          <dt className="font-semibold">Total</dt>
          <dd className="text-right">
            <span className="block font-display text-2xl font-normal text-ink">{formatGHS(total)}</span>
            {discount > 0 && <span className="block text-xs font-semibold text-[#2C6853]">You save {formatGHS(discount)}</span>}
          </dd>
        </div>
      </dl>

      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

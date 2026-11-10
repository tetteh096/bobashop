"use client";

import React from "react";
import Link from "next/link";
import { Check, Clock, MapPin, Store } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@bobashop/api/routers/index";
import { SHOP } from "@bobashop/api/data/shop";
import { formatGHS } from "../money";

export type ConfirmedOrder = inferRouterOutputs<AppRouter>["orders"]["verify"];

export function OrderSuccessModal({ order }: { order: ConfirmedOrder }) {
  const paid = order.status === "paid";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="order-success-title">
      <div className="absolute inset-0 bg-night/70 animate-in fade-in" />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card animate-in zoom-in-95 fade-in duration-300">
        <div className={`${paid ? "bg-brand" : "bg-ink"} text-white px-8 pt-10 pb-8 text-center relative overflow-hidden`}>
          <div aria-hidden className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-card/10" />
          <div
            className={`relative mx-auto w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500 ${
              paid ? "bg-gold text-ink" : "bg-card/15"
            }`}
          >
            {paid ? <Check className="w-8 h-8" strokeWidth={3} /> : <Clock className="w-8 h-8" />}
          </div>
          <h2 id="order-success-title" className="relative mt-5 font-display text-3xl font-normal tracking-tight">
            {paid ? "Order confirmed" : "Payment received"}
          </h2>
          <p className="relative mt-2 text-white/85">
            {paid
              ? `Thank you, ${order.customer.fullName.split(" ")[0]}. Paystack will email your receipt to ${order.customer.email}.`
              : "We're still confirming it with Paystack. Your order is saved; keep your order number and we'll be in touch."}
          </p>
        </div>

        <div className="p-7 space-y-5">
          <div className="flex items-center justify-between bg-tint px-5 py-4">
            <div>
              <p className="text-xs text-subtle">Order number</p>
              <p className="font-mono font-semibold">{order.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-subtle">{paid ? "Paid" : "Total"}</p>
              <p className="font-display text-2xl font-normal">{formatGHS(order.total)}</p>
            </div>
          </div>

          <div className="flex gap-3 text-sm">
            {order.fulfilment.method === "pickup" ? (
              <>
                <Store className="w-5 h-5 text-brand shrink-0" />
                <div className="space-y-1">
                  <p>
                    <span className="font-semibold">Pick up at {order.fulfilment.pickupPointName}</span>, {order.fulfilment.pickupPointAddress}.
                  </p>
                  <p>
                    We&apos;ll call {order.customer.phone} when it&apos;s ready.{" "}
                    {order.fulfilment.collectorName
                      ? `${order.fulfilment.collectorName} can collect it with your order number.`
                      : "Bring your order number when you come."}
                  </p>
                </div>
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 text-brand shrink-0" />
                <p>
                  <span className="font-semibold">Delivering to</span> {order.fulfilment.address}. Our rider
                  will call {order.customer.phone} before arriving.
                </p>
              </>
            )}
          </div>

          <ul className="text-sm divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.optionsLabel}`} className="py-2.5 flex justify-between gap-4">
                <span className="text-ink/80 line-clamp-1">
                  {item.quantity} × {item.name}
                  <span className="block text-xs text-subtle">{item.optionsLabel}</span>
                </span>
                <span className="font-semibold shrink-0">{formatGHS(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          {order.discount && (
            <p className="flex justify-between gap-4 text-sm">
              <span>
                Discount <span className="font-mono font-semibold">{order.discount.code}</span>
              </span>
              <span className="font-semibold text-[#2C6853]">−{formatGHS(order.discount.amount)}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/menu" className="text-center bg-brand hover:bg-brand-dark text-white font-semibold py-3.5 transition-colors">
              Keep shopping
            </Link>
            <Link href="/" className="text-center border border-ink/20 font-semibold py-3.5 hover:border-ink transition-colors">
              Back to home
            </Link>
          </div>
          <p className="text-center text-xs text-subtle">
            Questions about your order? Call {SHOP.phone} and quote {order.reference}.
          </p>
        </div>
      </div>
    </div>
  );
}

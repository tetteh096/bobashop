"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Tag, X } from "lucide-react";
import { useTRPC } from "@/utils/trpc";
import { useCart } from "./cart-context";

/** "Have a code?" link that opens an input; an accepted code shows as a removable chip. */
export function DiscountCodeField() {
  const trpc = useTRPC();
  const { discount, setDiscount } = useCart();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const check = useMutation(trpc.discounts.check.mutationOptions());

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return setError("Enter a code");
    setError(null);
    try {
      setDiscount(await check.mutateAsync({ code }));
      setCode("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work");
    }
  };

  if (discount) {
    return (
      <div className="flex items-center justify-between gap-3 border border-dashed border-brand/40 bg-tint px-4 py-3">
        <span className="flex items-center gap-2.5 min-w-0">
          <Tag className="w-4 h-4 text-brand shrink-0" />
          <span className="min-w-0">
            <span className="block font-mono text-sm font-bold tracking-wide">{discount.code}</span>
            <span className="block text-xs text-subtle truncate">{discount.label}</span>
          </span>
        </span>
        <button
          type="button"
          onClick={() => setDiscount(null)}
          aria-label={`Remove code ${discount.code}`}
          className="w-8 h-8 rounded-full hover:bg-card flex items-center justify-center shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline underline-offset-4 cursor-pointer"
      >
        <Tag className="w-4 h-4" /> Have a discount code?
      </button>
    );
  }

  return (
    <form onSubmit={apply} noValidate>
      <label htmlFor="discount-code" className="text-sm font-semibold">
        Discount code
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="discount-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Enter your code"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "discount-error" : undefined}
          className={`flex-1 min-w-0  border bg-card px-4 py-3 font-mono text-sm tracking-wide uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 ${
            error ? "border-sale ring-sale/30 focus:ring-sale/30" : "border-line focus:ring-brand/30"
          }`}
        />
        <button
          type="submit"
          disabled={check.isPending}
          className="bg-ink hover:bg-brand text-white font-semibold px-5 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {check.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && (
        <p id="discount-error" role="alert" className="mt-2 text-sm text-sale">
          {error}
        </p>
      )}
    </form>
  );
}

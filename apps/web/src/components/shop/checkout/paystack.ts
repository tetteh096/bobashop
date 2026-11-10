"use client";

const INLINE_JS = "https://js.paystack.co/v2/inline.js";

type PaystackSuccess = { reference: string; status?: string; trans?: string };

type PaystackPopInstance = {
  resumeTransaction: (
    accessCode: string,
    callbacks: {
      onSuccess?: (tx: PaystackSuccess) => void;
      onCancel?: () => void;
      onError?: (error: { message?: string }) => void;
    }
  ) => void;
};

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
  }
}

let loading: Promise<void> | null = null;

function loadInlineJs() {
  if (window.PaystackPop) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = INLINE_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load Paystack. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export type PaystackOutcome = { status: "success"; reference: string } | { status: "cancelled" };

/** Opens the Paystack popup for a transaction the server already initialised. */
export async function payWithPaystack(accessCode: string): Promise<PaystackOutcome> {
  await loadInlineJs();
  const Pop = window.PaystackPop;
  if (!Pop) throw new Error("Paystack is unavailable right now. Please try again.");

  return new Promise((resolve, reject) => {
    new Pop().resumeTransaction(accessCode, {
      onSuccess: (tx) => resolve({ status: "success", reference: tx.reference }),
      onCancel: () => resolve({ status: "cancelled" }),
      onError: (error) => reject(new Error(error?.message || "Payment could not be started.")),
    });
  });
}

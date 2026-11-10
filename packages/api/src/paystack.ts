const PAYSTACK_API = "https://api.paystack.co";

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

export type PaystackTransaction = {
  id: number;
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "reversed" | string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  paid_at: string | null;
};

async function paystackRequest<T>(
  secretKey: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await res.json()) as PaystackResponse<T>;
  if (!res.ok || !body.status) {
    throw new Error(body.message || `Paystack request failed (${res.status})`);
  }
  return body.data;
}

/** Starts a transaction. `amount` is in pesewas (GH₵ × 100). */
export function initializeTransaction(
  secretKey: string,
  params: {
    email: string;
    amount: number;
    reference: string;
    metadata?: Record<string, unknown>;
  }
) {
  return paystackRequest<{ authorization_url: string; access_code: string; reference: string }>(
    secretKey,
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        ...params,
        currency: "GHS",
        channels: ["card", "mobile_money", "bank_transfer"],
      }),
    }
  );
}

export function verifyTransaction(secretKey: string, reference: string) {
  return paystackRequest<PaystackTransaction>(
    secretKey,
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}

import { createHmac, timingSafeEqual } from "node:crypto";

import { confirmOrderPayment } from "@bobashop/api/routers/orders";
import { NextRequest, NextResponse } from "next/server";

import { ENV } from "../../../../env.server";
import { db } from "../../../../services";

// Paystack calls this after a charge, so an order is still marked paid if the
// customer closes the tab before the browser-side verification runs.
export async function POST(req: NextRequest) {
  const secretKey = ENV.PAYSTACK_SECRET_KEY;
  if (!secretKey || !db) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");

  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as { event: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      // Re-verifies with Paystack and checks the amount before marking paid.
      await confirmOrderPayment(db, secretKey, event.data.reference);
    } catch (error) {
      console.error("Paystack webhook: could not confirm order", event.data.reference, error);
    }
  }

  return NextResponse.json({ received: true });
}

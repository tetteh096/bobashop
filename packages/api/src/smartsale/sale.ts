// The sale a paid order becomes in the branch's POS: SmartSale's SubmitPaymentOnNewSale
// request, written to the store's `server_requests`. The shape matches what the POS already
// accepts from the Silver Lobster site; every price in it was set by our server, not the browser.

export interface SaleLine {
  pos: { posId: string; bin: string; dept: string; type: string; name: string };
  /** POS attribute choices, e.g. [{ name: "Size", value: "Large (700ml)" }]. */
  posOptions: { name: string; value: string }[];
  unitPrice: number;
  quantity: number;
}

export interface SaleInput {
  reference: string;
  customer: { fullName: string; email: string; phone: string };
  method: "delivery" | "pickup";
  address?: string;
  location?: { lat: number; lng: number };
  notes?: string;
  lines: SaleLine[];
  delivery?: { fee: number; byDistance: boolean; item?: { posId: string; bin: string; dept: string } };
  subtotal: number;
  discount?: { code: string; label: string; amount: number; percent?: number };
  total: number;
  /** Paystack's channel: card, mobile_money, bank, bank_transfer, ussd… */
  channel?: string;
  /** Minutes from now until it should be ready or arrive. */
  etaMinutes: number;
  now?: Date;
}

const PAYMENT_TYPE: Record<string, string> = {
  card: "CARD",
  mobile_money: "MOBILE MONEY",
  bank: "BANK TRANSFER",
  bank_transfer: "BANK TRANSFER",
};

const fixed = (n: number) => n.toFixed(2);

/** "14:35" in Accra (UTC all year). */
function clock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Accra", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export function buildSale(input: SaleInput) {
  const now = input.now ?? new Date();
  const basket = input.lines.map((line) => ({
    bin: line.pos.bin,
    dept: line.pos.dept,
    id: line.pos.posId,
    name: line.pos.name,
    options: line.posOptions,
    price: fixed(line.unitPrice),
    qty: String(line.quantity),
    type: line.pos.type,
  }));

  if (input.method === "delivery" && input.delivery) {
    basket.push({
      bin: input.delivery.item?.bin ?? "bin0",
      dept: input.delivery.item?.dept ?? "DELIVERY",
      id: input.delivery.item?.posId ?? "DELIVERY",
      name: "DELIVERY",
      options: input.delivery.byDistance ? [{ name: "location", value: "cost per km" }] : [],
      price: fixed(input.delivery.fee),
      qty: "1",
      type: "SERVICE",
    });
  }

  const remarks = [`Web order ${input.reference}`, input.notes && `Note: ${input.notes}`].filter(Boolean).join(" | ");
  const paymentType = PAYMENT_TYPE[input.channel ?? ""] ?? "CARD";
  const discount = input.discount?.amount ?? 0;

  return {
    header: {
      basketClass: "InventorySale",
      request: "SubmitPaymentOnNewSale",
      timestamp: now.toISOString().replace(/\.\d{3}Z$/, ""),
      user: input.customer.email,
    },
    request: {
      backOfficeRemarks: {
        address: input.method === "delivery" ? (input.address ?? "") : "",
        email: input.customer.email,
        eta: clock(new Date(now.getTime() + input.etaMinutes * 60_000)),
        phone: input.customer.phone,
        pickup_option: input.method === "delivery" ? "For Delivery" : "For Pickup",
        promoCode: input.discount?.code ?? "",
        promoName: input.discount?.label ?? "",
        gpsLocation: input.location ? `${input.location.lat.toFixed(6)}, ${input.location.lng.toFixed(6)}` : "",
      },
      basket,
      clientName: input.customer.fullName,
      clientNo: "",
      corporateNo: "",
      discountPercent: input.discount?.percent ?? 0,
      discountValue: discount,
      payments: [
        {
          amountRcvd: fixed(input.total),
          changeReturned: "0",
          description: paymentType,
          hostService: "",
          mobileWallet: "233",
          reference: input.reference,
          remarks: input.notes ?? "",
          type: paymentType,
        },
      ],
      pricingMode: 0,
      printSlip: "Yes",
      remarks,
      // Before the discount, as the POS expects: it takes discountValue off itself.
      saleValue: fixed(input.subtotal + (input.delivery?.fee ?? 0)),
      sendToBackOffice: "Yes",
      totalPromoDiscount: discount,
      promoCode: input.discount?.code ?? "",
    },
  };
}

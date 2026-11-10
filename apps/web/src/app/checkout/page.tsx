"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, Lock, MapPin, Navigation, Pencil, ShoppingBag, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { PICKUP_POINTS, SHOP } from "@bobashop/api/data/shop";
import { useCart } from "@/components/shop/cart-context";
import { OrderSummary, useOrderTotals } from "@/components/shop/order-summary";
import { FulfilmentChoice } from "@/components/shop/fulfilment-choice";
import { formatGHS } from "@/components/shop/money";
import { AddressPicker } from "@/components/shop/checkout/address-picker";
import type { LatLng } from "@/components/shop/checkout/location-map";
import { payWithPaystack } from "@/components/shop/checkout/paystack";
import { OrderSuccessModal, type ConfirmedOrder } from "@/components/shop/checkout/order-success-modal";
import { useFeatures } from "@/components/features";
import { SessionPrefill } from "@/components/session-prefill";
import { useTRPC } from "@/utils/trpc";

type Step = 1 | 2 | 3;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{9,16}$/;

type Errors = Partial<Record<"fullName" | "email" | "phone" | "address" | "location" | "pickup", string>>;

export default function CheckoutPage() {
  const trpc = useTRPC();
  const { items, clearCart, fulfilment: method, setFulfilment: setMethod, discount, setDiscount } = useCart();
  const { accountsEnabled } = useFeatures();

  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Errors>({});

  // How they'll get it (step 1)
  const [location, setLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [ghanaPostGps, setGhanaPostGps] = useState("");
  // With a single pickup point there is nothing to choose, so it starts selected.
  const [pickupPointId, setPickupPointId] = useState(PICKUP_POINTS.length === 1 ? PICKUP_POINTS[0].id : "");

  // Who it's for (step 2)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [collectorName, setCollectorName] = useState("");
  const [notes, setNotes] = useState("");

  const [paying, setPaying] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  const { total, discount: discountAmount } = useOrderTotals(method);
  const createOrder = useMutation(trpc.orders.create.mutationOptions());
  const verifyOrder = useMutation(trpc.orders.verify.mutationOptions());

  const isPickup = method === "pickup";
  const steps: { id: Step; label: string }[] = [
    { id: 1, label: "Delivery or pickup" },
    { id: 2, label: "Your details" },
    { id: 3, label: "Review & pay" },
  ];

  // Signed-in customers don't have to retype their name and email.
  const prefill = useCallback((user: { name?: string | null; email?: string | null }) => {
    setFullName((v) => v || user.name || "");
    setEmail((v) => v || user.email || "");
  }, []);

  const handleAddressFound = useCallback((found: string) => setAddress(found), []);

  const validateFulfilment = () => {
    const next: Errors = {};
    if (method === "delivery") {
      if (!location) next.location = "Set your location on the map, or tap “Use my location”";
      if (address.trim().length < 5) next.address = "Enter your delivery address";
    } else if (!pickupPointId) {
      next.pickup = "Choose where you'll collect from";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateDetails = () => {
    const next: Errors = {};
    if (fullName.trim().length < 2) next.fullName = "Enter your full name";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email so Paystack can send your receipt";
    if (!PHONE_RE.test(phone.trim())) next.phone = "Enter a phone number we can call, e.g. 024 000 0000";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 1 && validateFulfilment()) setStep(2);
    else if (step === 2 && validateDetails()) setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePay = async () => {
    if (!validateFulfilment()) return setStep(1);
    if (!validateDetails()) return setStep(2);

    setPaying(true);
    try {
      const order = await createOrder.mutateAsync({
        items: items.map((item) => ({ productId: item.product.id, options: item.options, quantity: item.quantity })),
        customer: { fullName: fullName.trim(), email: email.trim(), phone: phone.trim() },
        // Only sent when it's taking something off; the server re-checks and re-applies it.
        discountCode: discount && discountAmount > 0 ? discount.code : undefined,
        fulfilment:
          method === "delivery"
            ? {
                method: "delivery",
                address: address.trim(),
                landmark: landmark.trim() || undefined,
                ghanaPostGps: ghanaPostGps.trim() || undefined,
                location: location!,
                notes: notes.trim() || undefined,
              }
            : {
                method: "pickup",
                pickupPointId,
                collectorName: collectorName.trim() || undefined,
                notes: notes.trim() || undefined,
              },
      });

      const outcome = await payWithPaystack(order.accessCode);
      if (outcome.status === "cancelled") {
        toast("Payment cancelled", { description: "Your bag is still here whenever you're ready." });
        return;
      }

      const confirmed = await verifyOrder.mutateAsync({ reference: outcome.reference });
      setConfirmedOrder(confirmed);
      clearCart();
    } catch (error) {
      // A code that expired since it was applied shouldn't block the next attempt.
      if (discount && error instanceof Error && error.message.includes(discount.code)) setDiscount(null);
      toast.error("We couldn't complete your order", {
        description: error instanceof Error ? error.message : `Please try again, or call ${SHOP.phone}.`,
      });
    } finally {
      setPaying(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="min-h-[60vh]">
        <OrderSuccessModal order={confirmedOrder} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-3 sm:mx-5 lg:mx-8 bg-paper px-4 py-20 text-center">
        <div className="mx-auto w-16 h-16 bg-tint flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-brand" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-normal">Your bag is empty</h1>
        <p className="mt-2 text-subtle">Add a drink or two and come back to check out.</p>
        <Link href="/menu" className="mt-8 inline-flex items-center gap-2 bg-brand text-white font-semibold px-6 py-3.5">
          See the menu <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const selectedPickup = PICKUP_POINTS.find((p) => p.id === pickupPointId);

  return (
    <div className="bg-paper text-ink overflow-clip">
      {accountsEnabled && <SessionPrefill onUser={prefill} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
        <Link href={"/cart" as "/"} className="inline-flex items-center gap-2 text-sm font-semibold text-subtle hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Back to your bag
        </Link>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl font-light uppercase tracking-[0.02em]">Checkout</h1>

        {/* Stepper */}
        <ol className="mt-8 flex items-center gap-2 sm:gap-4">
          {steps.map((s, i) => {
            const done = step > s.id;
            const current = step === s.id;
            return (
              <li key={s.id} className="flex items-center gap-2 sm:gap-4 flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => done && setStep(s.id)}
                  disabled={!done}
                  aria-current={current ? "step" : undefined}
                  className="flex items-center gap-2.5 disabled:cursor-default cursor-pointer"
                >
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-normal shrink-0 transition-colors ${
                      done ? "bg-brand text-white" : current ? "bg-ink text-white" : "bg-tint text-subtle"
                    }`}
                  >
                    {done ? <Check className="w-5 h-5" /> : s.id}
                  </span>
                  <span className={`hidden sm:inline font-semibold ${current || done ? "" : "text-subtle"}`}>{s.label}</span>
                </button>
                {i < steps.length - 1 && <span className={`h-0.5 flex-1 ${done ? "bg-brand" : "bg-line"}`} />}
              </li>
            );
          })}
        </ol>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
          <div className="min-w-0">
            {step === 1 && (
              <section className="space-y-6">
                <h2 className="font-display text-3xl font-normal">How would you like to get it?</h2>
                <FulfilmentChoice value={method} onChange={setMethod} />

                {method === "delivery" ? (
                  <div className="space-y-5">
                    <div>
                      <p className="font-semibold mb-3">Where should we deliver?</p>
                      <AddressPicker location={location} onLocationChange={setLocation} onAddressFound={handleAddressFound} />
                      {errors.location && <p className="mt-2 text-sm text-sale">{errors.location}</p>}
                    </div>
                    <Field label="Delivery address" hint="Filled in from the map; edit it if it's not quite right" error={errors.address}>
                      <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" placeholder="House number, street, area" className={inputClass(errors.address)} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Nearby landmark" hint="Optional">
                        <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Behind the Shell station" className={inputClass()} />
                      </Field>
                      <Field label="GhanaPost GPS address" hint="Optional, e.g. GA-414-9969">
                        <input value={ghanaPostGps} onChange={(e) => setGhanaPostGps(e.target.value.toUpperCase())} placeholder="GA-000-0000" className={inputClass()} />
                      </Field>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <p className="font-semibold mb-3">{PICKUP_POINTS.length === 1 ? "You'll collect from" : "Choose where to collect"}</p>
                      <div className="grid grid-cols-1 gap-3">
                        {PICKUP_POINTS.map((point) => {
                          const active = pickupPointId === point.id;
                          return (
                            <div
                              key={point.id}
                              className={` border-2 p-5 sm:p-6 transition-colors ${active ? "border-brand bg-tint" : "border-line bg-card"}`}
                            >
                              <button
                                type="button"
                                onClick={() => setPickupPointId(point.id)}
                                aria-pressed={active}
                                disabled={PICKUP_POINTS.length === 1}
                                className="w-full flex gap-4 text-left cursor-pointer disabled:cursor-default"
                              >
                                <span className="w-12 h-12 bg-brand text-butter flex items-center justify-center shrink-0">
                                  <Store className="w-6 h-6" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block font-display text-xl font-normal">{point.name}</span>
                                  <span className="mt-1 flex items-start gap-1.5 text-sm text-subtle">
                                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> {point.address}
                                  </span>
                                  <span className="mt-1 flex items-start gap-1.5 text-sm text-subtle">
                                    <Clock className="w-4 h-4 shrink-0 mt-0.5" /> {point.hours}
                                  </span>
                                </span>
                              </button>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.address)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 ml-16 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline underline-offset-4"
                              >
                                <Navigation className="w-3.5 h-3.5" /> Get directions
                              </a>
                            </div>
                          );
                        })}
                      </div>
                      {errors.pickup && <p className="mt-2 text-sm text-sale">{errors.pickup}</p>}
                    </div>

                    <div className="bg-butter-soft p-5 sm:p-6">
                      <p className="font-display text-lg font-normal">How pickup works</p>
                      <ol className="mt-3 space-y-2.5 text-sm">
                        {[
                          "Pay online now, so there's nothing to pay at the shop.",
                          `We make it fresh, about ${SHOP.pickupMinutes} minutes, and text you when it's ready.`,
                          "Show your order number at the counter, or send someone with it.",
                        ].map((text, i) => (
                          <li key={text} className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-ink text-butter text-xs font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section className="space-y-5">
                <h2 className="font-display text-3xl font-normal">Who&apos;s this order for?</h2>
                <Field label="Full name" error={errors.fullName}>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Your name" className={inputClass(errors.fullName)} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Email" hint="Paystack sends your receipt here" error={errors.email}>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className={inputClass(errors.email)} />
                  </Field>
                  <Field label="Phone" hint={isPickup ? "We'll call when it's ready" : "Our rider calls before arriving"} error={errors.phone}>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="024 000 0000" className={inputClass(errors.phone)} />
                  </Field>
                </div>
                {isPickup && (
                  <Field label="Who's collecting?" hint="Optional, if it isn't you">
                    <input value={collectorName} onChange={(e) => setCollectorName(e.target.value)} placeholder="e.g. Kofi (driver)" className={inputClass()} />
                  </Field>
                )}
                <Field label="Notes for us" hint="Optional">
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isPickup ? "Time you'll arrive, allergies…" : "Gate code, allergies, best time to call…"}
                    className={inputClass()}
                  />
                </Field>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-5">
                <h2 className="font-display text-3xl font-normal">Check everything&apos;s right</h2>
                <ReviewBlock title={isPickup ? "Pickup" : "Delivery"} icon={isPickup ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" />} onEdit={() => setStep(1)}>
                  {isPickup ? (
                    <>
                      <p className="font-semibold">{selectedPickup?.name}</p>
                      <p>{selectedPickup?.address}</p>
                      <p className="text-subtle">{selectedPickup?.hours}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">{address}</p>
                      {landmark && <p>Near {landmark}</p>}
                      {ghanaPostGps && <p>GhanaPost GPS: {ghanaPostGps}</p>}
                      {location && (
                        <p className="font-mono text-xs text-subtle mt-1">
                          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </p>
                      )}
                    </>
                  )}
                </ReviewBlock>
                <ReviewBlock title="Your details" onEdit={() => setStep(2)}>
                  <p className="font-semibold">{fullName}</p>
                  <p>{email}</p>
                  <p>{phone}</p>
                  {isPickup && collectorName && <p className="mt-2">Collected by: {collectorName}</p>}
                  {notes && <p className="mt-2 text-subtle">“{notes}”</p>}
                </ReviewBlock>
              </section>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  disabled={paying}
                  className="inline-flex items-center gap-2 border border-ink/20 px-6 py-3.5 font-semibold hover:bg-ink hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 bg-tomato hover:bg-tomato-dark text-white px-7 py-3.5 font-semibold transition-colors cursor-pointer"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying}
                  className="inline-flex items-center gap-2 bg-tomato hover:bg-tomato-dark text-white px-8 py-4 text-lg font-semibold transition-colors disabled:opacity-70 cursor-pointer"
                >
                  {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  {paying ? "Processing…" : `Pay ${formatGHS(total)}`}
                </button>
              )}
            </div>
            {step === 3 && (
              <p className="mt-4 text-sm text-subtle">
                You&apos;ll pay securely with Paystack by card, mobile money (MTN, Telecel, AirtelTigo) or bank transfer.
              </p>
            )}
          </div>

          <div className="lg:sticky lg:top-32">
            <OrderSummary method={method} showItems />
          </div>
        </div>
      </div>
    </div>
  );
}

function inputClass(error?: string) {
  return `w-full bg-card border border-line  px-4 py-3.5 text-base focus:outline-none focus:ring-2 ${
    error ? "ring-2 ring-sale focus:ring-sale" : "focus:ring-brand"
  }`;
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-xs text-subtle">{hint}</span>}
      </span>
      {children}
      {error && <span className="block mt-1.5 text-sm text-sale">{error}</span>}
    </label>
  );
}

function ReviewBlock({ title, icon, onEdit, children }: { title: string; icon?: React.ReactNode; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-line bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="font-display text-lg font-normal flex items-center gap-2">
          {icon && <span className="w-7 h-7 rounded-lg bg-tint text-brand flex items-center justify-center">{icon}</span>}
          {title}
        </p>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline underline-offset-4 cursor-pointer">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      </div>
      <div className="text-sm text-ink/80 space-y-0.5">{children}</div>
    </div>
  );
}

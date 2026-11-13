"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock, Loader2, Lock, MapPin, Navigation, Pencil, Route, ShoppingBag, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { SHOP } from "@bobashop/api/data/shop";
import { branchesDeliveringTo, quoteDelivery } from "@bobashop/api/branch-menu";
import type { CustomerProfile } from "@bobashop/api/customers";
import { useBranch } from "@/components/branch";
import { useCart } from "@/components/shop/cart-context";
import { OrderSummary, useOrderTotals } from "@/components/shop/order-summary";
import { FulfilmentChoice } from "@/components/shop/fulfilment-choice";
import { formatGHS } from "@/components/shop/money";
import { AddressPicker } from "@/components/shop/checkout/address-picker";
import { CustomerLookup } from "@/components/shop/checkout/customer-lookup";
import type { LatLng } from "@/components/shop/checkout/location-map";
import { payWithPaystack } from "@/components/shop/checkout/paystack";
import { OrderSuccessModal, type ConfirmedOrder } from "@/components/shop/checkout/order-success-modal";
import { useFeatures } from "@/components/features";
import { SessionPrefill } from "@/components/session-prefill";
import { useTRPC } from "@/utils/trpc";

type Step = 1 | 2 | 3;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{9,16}$/;

type Errors = Partial<Record<"fullName" | "email" | "phone" | "address" | "location", string>>;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Your details" },
  { id: 2, label: "Pickup or delivery" },
  { id: 3, label: "Review & pay" },
];

export default function CheckoutPage() {
  const trpc = useTRPC();
  const { items, clearCart, fulfilment: method, setFulfilment: setMethod, discount, setDiscount } = useCart();
  const { branch, openPicker, setBranchId } = useBranch();
  const { accountsEnabled } = useFeatures();

  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Errors>({});
  const [usedProfile, setUsedProfile] = useState(false);

  // Who it's for (step 1)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // How they'll get it (step 2)
  const [location, setLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [ghanaPostGps, setGhanaPostGps] = useState("");
  const [collectorName, setCollectorName] = useState("");
  const [notes, setNotes] = useState("");

  const [paying, setPaying] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  const isPickup = method === "pickup";
  // Priced from the chosen branch to the pin, exactly as the server will price it.
  const quote = branch && location && !isPickup ? quoteDelivery(branch, location, SHOP.pickupMinutes) : null;
  const distanceFee = quote?.ok ? quote.fee : null;
  const { total, discount: discountAmount } = useOrderTotals(method, distanceFee);
  const createOrder = useMutation(trpc.orders.create.mutationOptions());
  const verifyOrder = useMutation(trpc.orders.verify.mutationOptions());

  // A pickup-only branch can't deliver.
  useEffect(() => {
    if (branch && !branch.delivery.enabled && method === "delivery") setMethod("pickup");
  }, [branch, method, setMethod]);

  // Signed-in customers don't have to retype their name and email.
  const prefill = useCallback((user: { name?: string | null; email?: string | null }) => {
    setFullName((v) => v || user.name || "");
    setEmail((v) => v || user.email || "");
  }, []);

  const handleAddressFound = useCallback((found: string) => setAddress(found), []);

  // A returning customer's saved details fill the whole checkout.
  const applyProfile = (p: CustomerProfile) => {
    setFullName(p.fullName);
    setEmail(p.email);
    setPhone(p.phone);
    if (p.method === "delivery" && p.location) {
      setLocation(p.location);
      setAddress(p.address ?? "");
      setLandmark(p.landmark ?? "");
      setGhanaPostGps(p.ghanaPostGps ?? "");
    }
    if (!branch && p.branchId) setBranchId(p.branchId);
    setMethod(p.method === "delivery" && (branch ?? null)?.delivery.enabled !== false ? "delivery" : "pickup");
    setUsedProfile(true);
    setErrors({});
    toast.success(`Welcome back, ${p.fullName.split(" ")[0]}`, { description: "Your details are filled in. Check them and carry on." });
  };

  const validateDetails = () => {
    const next: Errors = {};
    if (fullName.trim().length < 2) next.fullName = "Enter your full name";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email so Paystack can send your receipt";
    if (!PHONE_RE.test(phone.trim())) next.phone = "Enter a phone number we can call, e.g. 024 000 0000";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateFulfilment = () => {
    const next: Errors = {};
    if (method === "delivery") {
      if (!location) next.location = "Set your location on the map, or tap “Use my location”";
      else if (quote && !quote.ok) next.location = quote.message;
      if (address.trim().length < 5) next.address = "Enter your delivery address";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!branch) return openPicker();
    if (step === 1 && validateDetails()) setStep(2);
    else if (step === 2 && validateFulfilment()) setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePay = async () => {
    if (!branch) return openPicker();
    if (!validateDetails()) return setStep(1);
    if (!validateFulfilment()) return setStep(2);

    setPaying(true);
    try {
      const order = await createOrder.mutateAsync({
        items: items.map((item) => ({ productId: item.product.id, options: item.options, quantity: item.quantity })),
        customer: { fullName: fullName.trim(), email: email.trim(), phone: phone.trim() },
        branchId: branch.id,
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
        description: error instanceof Error ? error.message : `Please try again, or call ${branch.phone}.`,
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
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16">
        <div className="rounded-[32px] bg-card border border-line px-6 py-16 text-center flex flex-col items-center">
          <span className="w-16 h-16 rounded-full bg-gold-soft flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-brand" />
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold">Your bag is empty</h1>
          <p className="mt-2 text-subtle">Add something tasty and come back to check out.</p>
          <Link href="/menu" className="mt-8 inline-flex items-center gap-2 min-h-13 px-7 rounded-full bg-brand-deep text-cream font-medium">
            See the menu <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const closed = Boolean(branch && !branch.orderingOpen);
  const alternatives = location && quote && !quote.ok ? branchesDeliveringTo(location, branch?.id).slice(0, 3) : [];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-8 pb-24">
      {accountsEnabled && <SessionPrefill onUser={prefill} />}
      <Link href={"/cart" as "/"} className="inline-flex items-center gap-2 text-sm font-medium text-subtle hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Back to your bag
      </Link>
      <h1 className="mt-3 font-display font-bold text-[44px] sm:text-6xl leading-none text-brand-deep">Checkout</h1>

      {/* The branch was chosen once, in the picker; checkout just shows it. */}
      {branch ? (
        <div className="mt-6 rounded-[24px] bg-brand-deep text-cream px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 rounded-2xl bg-gold text-ink flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-cream/70">Ordering from</p>
              <p className="font-display text-xl font-semibold leading-tight truncate">
                Bobalicious {branch.name} <span className="font-sans text-sm font-normal text-cream/70">· {branch.address}</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={openPicker} className="min-h-11 px-4 rounded-full border border-cream/30 hover:bg-cream hover:text-ink text-sm font-medium cursor-pointer">
            Change branch
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] bg-gold-soft border border-gold p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-xl font-semibold">Which branch should make your order?</p>
            <p className="text-[15px] text-ink/75">Pick one and we&apos;ll price delivery from there.</p>
          </div>
          <button type="button" onClick={openPicker} className="min-h-12 px-6 rounded-full bg-brand-deep text-cream hover:bg-night font-medium cursor-pointer">
            Choose your branch
          </button>
        </div>
      )}
      {closed && (
        <div role="alert" className="mt-3 rounded-[20px] bg-tomato-soft text-tomato-dark px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            {branch!.closedMessage ?? `${branch!.name} isn't taking online orders right now.`} You can switch to another branch, or call{" "}
            <a href={branch!.telHref} className="font-semibold underline">
              {branch!.phone}
            </a>
            .
          </p>
        </div>
      )}

      {/* Stepper */}
      <ol className="mt-8 flex items-center gap-2 sm:gap-4">
        {STEPS.map((s, i) => {
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold shrink-0 transition-colors ${
                    done ? "bg-brand text-cream" : current ? "bg-brand-deep text-gold" : "bg-tint text-subtle"
                  }`}
                >
                  {done ? <Check className="w-5 h-5" /> : s.id}
                </span>
                <span className={`hidden sm:inline font-medium ${current || done ? "" : "text-subtle"}`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${done ? "bg-brand" : "bg-line"}`} />}
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
        <div className="min-w-0">
          {step === 1 && (
            <section className="space-y-6">
              <CustomerLookup onUse={applyProfile} used={usedProfile} />
              <h2 className="font-display text-3xl font-bold">Who&apos;s this order for?</h2>
              <Field label="Full name" error={errors.fullName}>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Your name" className={inputClass(errors.fullName)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Phone" hint="For updates on your order" error={errors.phone}>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="024 000 0000" className={inputClass(errors.phone)} />
                </Field>
                <Field label="Email" hint="Paystack sends your receipt here" error={errors.email}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className={inputClass(errors.email)} />
                </Field>
              </div>
            </section>
          )}

          {step === 2 && branch && (
            <section className="space-y-6">
              <h2 className="font-display text-3xl font-bold">How would you like to get it?</h2>
              <FulfilmentChoice value={method} onChange={setMethod} />

              {method === "delivery" ? (
                <div className="space-y-5">
                  <div>
                    <p className="font-semibold mb-3">Where should we deliver?</p>
                    <AddressPicker location={location} onLocationChange={setLocation} onAddressFound={handleAddressFound} />
                    {errors.location && !(quote && !quote.ok) && <p className="mt-2 text-sm text-sale">{errors.location}</p>}
                  </div>

                  {/* The live quote for this pin */}
                  {quote?.ok && (
                    <div className="rounded-[22px] bg-gold-soft border border-gold/50 p-5 grid grid-cols-3 gap-3">
                      <QuoteStat icon={<Route className="w-4 h-4" />} label="Distance" value={`${quote.km} km`} />
                      <QuoteStat icon={<Truck className="w-4 h-4" />} label="Delivery" value={formatGHS(quote.fee)} />
                      <QuoteStat icon={<Clock className="w-4 h-4" />} label="Arrives in" value={`~${quote.etaMinutes} min`} />
                      <p className="col-span-3 text-sm text-ink/70">
                        From Bobalicious {branch.name}: {formatGHS(branch.delivery.baseFee)} + {formatGHS(branch.delivery.perKm)} per km. Free over GH₵150.
                      </p>
                    </div>
                  )}
                  {quote && !quote.ok && (
                    <div role="alert" className="rounded-[22px] bg-tomato-soft text-tomato-dark p-5">
                      <p className="font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> {quote.message}
                      </p>
                      {alternatives.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {alternatives.map(({ branch: b, quote: q }) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setBranchId(b.id)}
                              className="min-h-11 px-4 rounded-full bg-brand-deep text-cream hover:bg-night text-sm font-medium cursor-pointer"
                            >
                              Switch to {b.name} · {q.km} km · {formatGHS(q.fee)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm">No branch delivers that far yet. You could pick up instead.</p>
                      )}
                    </div>
                  )}

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
                  <div className="rounded-[22px] border-2 border-brand bg-gold-soft p-5 sm:p-6 flex gap-4">
                    <span className="w-12 h-12 rounded-2xl bg-brand text-cream flex items-center justify-center shrink-0">
                      <Store className="w-6 h-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-xl font-semibold">Bobalicious {branch.name}</p>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-ink/75">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> {branch.address}
                      </p>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-ink/75">
                        <Clock className="w-4 h-4 shrink-0 mt-0.5" /> Ready about {SHOP.pickupMinutes} minutes after you pay
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${branch.location.lat},${branch.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline underline-offset-4"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Get directions
                      </a>
                    </div>
                  </div>
                  <Field label="Who's collecting?" hint="Optional, if it isn't you">
                    <input value={collectorName} onChange={(e) => setCollectorName(e.target.value)} placeholder="e.g. Kofi (driver)" className={inputClass()} />
                  </Field>
                </div>
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

          {step === 3 && branch && (
            <section className="space-y-4">
              <h2 className="font-display text-3xl font-bold">Check everything&apos;s right</h2>
              <ReviewBlock title="Your details" onEdit={() => setStep(1)}>
                <p className="font-semibold">{fullName}</p>
                <p>{phone}</p>
                <p>{email}</p>
              </ReviewBlock>
              <ReviewBlock
                title={isPickup ? `Pickup at ${branch.name}` : `Delivery from ${branch.name}`}
                icon={isPickup ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                onEdit={() => setStep(2)}
              >
                {isPickup ? (
                  <>
                    <p>{branch.address}</p>
                    <p className="text-subtle">Ready about {SHOP.pickupMinutes} minutes after you pay</p>
                    {collectorName && <p className="mt-2">Collected by: {collectorName}</p>}
                  </>
                ) : (
                  <>
                    <p className="font-semibold">{address}</p>
                    {landmark && <p>Near {landmark}</p>}
                    {ghanaPostGps && <p>GhanaPost GPS: {ghanaPostGps}</p>}
                    {quote?.ok && (
                      <p className="text-subtle">
                        {quote.km} km away · arrives in about {quote.etaMinutes} minutes
                      </p>
                    )}
                  </>
                )}
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
                className="inline-flex items-center gap-2 min-h-13 px-6 rounded-full border border-ink/20 font-medium hover:bg-ink hover:text-paper transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 min-h-13 px-7 rounded-full bg-tomato hover:bg-tomato-dark text-white font-medium transition-colors cursor-pointer"
              >
                {branch ? "Continue" : "Choose your branch"} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePay}
                disabled={paying || closed}
                className="inline-flex items-center gap-2 min-h-14 px-8 rounded-full bg-tomato hover:bg-tomato-dark text-white text-lg font-semibold transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
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
          <OrderSummary method={method} distanceFee={distanceFee} showItems />
        </div>
      </div>
    </div>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-2xl bg-card border border-line px-4 py-3.5 text-base focus:outline-none focus:ring-2 ${
    error ? "ring-2 ring-sale focus:ring-sale" : "focus:ring-brand/40"
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

function QuoteStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink/60">
        {icon} {label}
      </p>
      <p className="mt-0.5 font-display text-xl sm:text-2xl font-bold text-brand-deep">{value}</p>
    </div>
  );
}

function ReviewBlock({ title, icon, onEdit, children }: { title: string; icon?: React.ReactNode; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-line bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="font-display text-lg font-semibold flex items-center gap-2">
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

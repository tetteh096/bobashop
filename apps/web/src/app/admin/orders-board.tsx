"use client";

import type { AdminOrder, AdminStatusFilter } from "@bobashop/api/routers/admin";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  Store,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { formatGHS } from "@/components/shop/money";
import { useTRPC } from "@/utils/trpc";

const TABS: { id: AdminStatusFilter; label: string; tone: string }[] = [
  { id: "all", label: "All orders", tone: "bg-card" },
  { id: "paid", label: "Paid", tone: "bg-[#E3F1EA]" },
  { id: "pending_payment", label: "Awaiting payment", tone: "bg-gold-soft" },
  { id: "payment_failed", label: "Payment failed", tone: "bg-tomato-soft" },
  { id: "pos_failed", label: "Paid, not in POS", tone: "bg-tomato-soft" },
];

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Accra",
});

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function OrdersBoard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<AdminStatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [branchId, setBranchId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const search = useDebounced(searchText.trim(), 350);
  const filters = {
    status,
    ...(search && { search }),
    ...(branchId && { branchId }),
    ...(from && { from }),
    ...(to && { to }),
  };

  // A filter change starts again from page 1.
  useEffect(() => setPage(1), [status, search, branchId, from, to]);

  const list = useQuery({
    ...trpc.admin.orders.list.queryOptions({ ...filters, page }),
    placeholderData: keepPreviousData,
    // New orders show up without reloading the page.
    refetchInterval: 30_000,
  });
  const data = list.data;
  const filtered = Boolean(search || branchId || from || to);

  const clearFilters = () => {
    setSearchText("");
    setBranchId("");
    setFrom("");
    setTo("");
    setStatus("all");
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await queryClient.fetchQuery(trpc.admin.orders.export.queryOptions(filters));
      downloadCsv(rows, from, to);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-subtle">Every online order across branches, newest first. Refreshes every 30 seconds.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => list.refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm font-semibold hover:bg-tint cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${list.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || !data?.total}
            className="inline-flex items-center gap-2 rounded-full bg-brand-deep text-cream px-4 py-2.5 text-sm font-semibold hover:bg-night disabled:opacity-50 cursor-pointer"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {data && !data.posSending && (
        <p className="flex items-start gap-2 rounded-2xl bg-gold-soft border border-gold/50 px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Sending orders to the POS is switched off (<code className="font-mono text-xs">SMARTSALE_SUBMIT_ORDERS=false</code>). Paid
            orders are saved here, but no slip prints at the branch.
          </span>
        </p>
      )}

      {/* Status tabs, with counts that follow the other filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TABS.map((tab) => {
          const active = status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              aria-pressed={active}
              className={`rounded-2xl border px-4 py-3 text-left transition-shadow cursor-pointer ${tab.tone} ${
                active ? "border-brand-deep ring-2 ring-brand-deep/20" : "border-line hover:shadow-sm"
              }`}
            >
              <span className="block text-xs font-semibold text-subtle">{tab.label}</span>
              <span className="block font-display text-2xl tabular-nums">{data?.counts[tab.id] ?? "–"}</span>
            </button>
          );
        })}
        <div className="rounded-2xl border border-line bg-card px-4 py-3">
          <span className="block text-xs font-semibold text-subtle">Paid{filtered ? " (filtered)" : ""}</span>
          <span className="block font-display text-2xl tabular-nums">{data ? formatGHS(data.paidTotal) : "–"}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Reference, customer name, phone or email"
            aria-label="Search orders"
            className="w-full rounded-full bg-card border border-line pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          aria-label="Branch"
          className="rounded-full bg-card border border-line px-4 py-2.5 text-sm"
        >
          <option value="">All branches</option>
          {data?.branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-subtle">From</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="rounded-full bg-card border border-line px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-subtle">To</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="rounded-full bg-card border border-line px-3 py-2" />
        </label>
        {(filtered || status !== "all") && (
          <button type="button" onClick={clearFilters} className="text-sm font-semibold text-brand hover:underline cursor-pointer">
            Clear filters
          </button>
        )}
      </div>

      {/* The list */}
      {list.isError ? (
        <p className="rounded-2xl bg-tomato-soft px-4 py-3 text-sm">{errorMessage(list.error)}</p>
      ) : !data ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-subtle" />
        </div>
      ) : data.orders.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-line py-16 text-center">
          <p className="font-display text-xl">No orders {filtered || status !== "all" ? "match these filters" : "yet"}</p>
          <p className="mt-1 text-sm text-subtle">
            {filtered || status !== "all" ? "Try clearing the filters." : "They appear here as soon as a customer starts paying."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[22px] border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="bg-tint text-left text-xs uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">Placed</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Branch</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.orders.map((order) => (
                <tr
                  key={order.reference}
                  onClick={() => setSelected(order.reference)}
                  className="cursor-pointer hover:bg-tint/60 align-top"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="block">{dateTime.format(new Date(order.createdAt))}</span>
                    <span className="block font-mono text-[11px] text-subtle">{order.reference}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-semibold">{order.customer.fullName}</span>
                    <span className="block text-subtle">{order.customer.phone}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[320px]">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-subtle">
                      {order.fulfilment.method === "delivery" ? <Truck className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                      {order.fulfilment.method === "delivery" ? "Delivery" : "Pickup"}
                    </span>
                    <span className="block truncate">{itemsSummary(order)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{order.branch.name}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">{formatGHS(order.total)}</td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PosBadge order={order} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-subtle">
            Page {data.page} of {data.pageCount} · {data.total} orders
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-3 py-2 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Newer
            </button>
            <button
              type="button"
              disabled={page >= data.pageCount}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-3 py-2 disabled:opacity-40 cursor-pointer"
            >
              Older <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selected && <OrderDrawer reference={selected} posSending={data?.posSending ?? false} onClose={() => setSelected(null)} />}
    </div>
  );
}

function itemsSummary(order: AdminOrder) {
  return order.items.map((i) => `${i.quantity}× ${i.name}${i.optionsLabel ? ` (${i.optionsLabel})` : ""}`).join(", ");
}

function PaymentBadge({ status }: { status: AdminOrder["status"] }) {
  const [label, tone] =
    status === "paid"
      ? ["Paid", "bg-[#E3F1EA] text-[#2C6853]"]
      : status === "pending_payment"
        ? ["Awaiting payment", "bg-gold-soft text-ink"]
        : ["Failed", "bg-tomato-soft text-tomato-dark"];
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${tone}`}>{label}</span>;
}

function PosBadge({ order }: { order: AdminOrder }) {
  if (order.status !== "paid") return <span className="text-xs text-subtle">–</span>;
  const s = order.smartsale.status;
  const [label, tone] =
    s === "sent"
      ? ["In POS", "bg-[#E3F1EA] text-[#2C6853]"]
      : s === "failed"
        ? ["Failed", "bg-tomato-soft text-tomato-dark"]
        : s === "sending"
          ? ["Sending", "bg-gold-soft text-ink"]
          : ["Not sent", "bg-tint text-ink"];
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${tone}`} title={order.smartsale.error}>
      {label}
    </span>
  );
}

function OrderDrawer({ reference, posSending, onClose }: { reference: string; posSending: boolean; onClose: () => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const order = useQuery(trpc.admin.orders.get.queryOptions({ reference }));

  const refresh = (updated: AdminOrder) => {
    queryClient.setQueryData(trpc.admin.orders.get.queryKey({ reference }), updated);
    queryClient.invalidateQueries({ queryKey: trpc.admin.orders.list.pathKey() });
  };
  const recheck = useMutation(
    trpc.admin.orders.recheckPayment.mutationOptions({
      onSuccess: (updated) => {
        refresh(updated);
        toast.success(
          updated.status === "paid" ? "Paystack confirms it's paid." : updated.status === "payment_failed" ? "Paystack says the payment failed." : "Still not paid on Paystack."
        );
      },
      onError: (error) => toast.error(error.message),
    })
  );
  const resend = useMutation(
    trpc.admin.orders.resendToPos.mutationOptions({
      onSuccess: (updated) => {
        refresh(updated);
        if (updated.smartsale.status === "sent") toast.success("Sent to the POS.");
        else toast.error(updated.smartsale.error ?? "The POS didn't take it. Try again in a minute.");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const o = order.data;
  const whatsapp = o ? `https://wa.me/${o.customer.phone.replace(/\D/g, "").replace(/^0/, "233")}` : "";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Order ${reference}`}>
      <div className="absolute inset-0 bg-night/50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-paper shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line bg-card">
          <div>
            <p className="font-mono text-xs text-subtle">{reference}</p>
            <h2 className="font-display text-2xl">{o ? o.customer.fullName : "Order"}</h2>
            {o && <p className="text-sm text-subtle">{dateTime.format(new Date(o.createdAt))} · {o.branch.name}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-tint cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!o ? (
          <div className="flex-1 flex items-center justify-center">
            {order.isError ? <p className="text-sm">{order.error.message}</p> : <Loader2 className="w-6 h-6 animate-spin text-subtle" />}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
            <div className="flex flex-wrap gap-2">
              <PaymentBadge status={o.status} />
              <PosBadge order={o} />
            </div>

            {/* Fixes */}
            {(o.status !== "paid" || o.smartsale.status !== "sent") && (
              <div className="flex flex-wrap gap-2">
                {o.status !== "paid" && (
                  <button
                    type="button"
                    onClick={() => recheck.mutate({ reference })}
                    disabled={recheck.isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-deep text-cream px-4 py-2.5 font-semibold disabled:opacity-60 cursor-pointer"
                  >
                    {recheck.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Re-check payment with Paystack
                  </button>
                )}
                {o.status === "paid" && o.smartsale.status !== "sent" && (
                  <button
                    type="button"
                    onClick={() => resend.mutate({ reference })}
                    disabled={resend.isPending || !posSending}
                    title={posSending ? undefined : "Sending to the POS is switched off"}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-deep text-cream px-4 py-2.5 font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {resend.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send to POS
                  </button>
                )}
              </div>
            )}

            <Section title="Customer">
              <div className="flex flex-wrap gap-2">
                <ContactLink href={`tel:${o.customer.phone.replace(/\s/g, "")}`} icon={<Phone className="w-4 h-4" />}>
                  {o.customer.phone}
                </ContactLink>
                <ContactLink href={whatsapp} icon={<MessageCircle className="w-4 h-4" />} external>
                  WhatsApp
                </ContactLink>
                <ContactLink href={`mailto:${o.customer.email}`} icon={<Mail className="w-4 h-4" />}>
                  {o.customer.email}
                </ContactLink>
              </div>
            </Section>

            <Section title={o.fulfilment.method === "delivery" ? "Delivery" : "Pickup"}>
              {o.fulfilment.method === "delivery" ? (
                <dl className="space-y-1.5">
                  <Row label="Address">{o.fulfilment.address}</Row>
                  {o.fulfilment.landmark && <Row label="Landmark">{o.fulfilment.landmark}</Row>}
                  {o.fulfilment.ghanaPostGps && <Row label="GhanaPost GPS">{o.fulfilment.ghanaPostGps}</Row>}
                  {o.fulfilment.distanceKm !== undefined && <Row label="Distance">{o.fulfilment.distanceKm} km from {o.branch.name}</Row>}
                  <Row label="Map">
                    <a
                      href={`https://www.google.com/maps?q=${o.fulfilment.location.lat},${o.fulfilment.location.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {o.fulfilment.location.lat.toFixed(5)}, {o.fulfilment.location.lng.toFixed(5)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Row>
                  {o.fulfilment.notes && <Row label="Notes">{o.fulfilment.notes}</Row>}
                </dl>
              ) : (
                <dl className="space-y-1.5">
                  <Row label="At">{o.fulfilment.pickupPointName}</Row>
                  {o.fulfilment.collectorName && <Row label="Collected by">{o.fulfilment.collectorName}</Row>}
                  {o.fulfilment.notes && <Row label="Notes">{o.fulfilment.notes}</Row>}
                </dl>
              )}
            </Section>

            <Section title="Items">
              <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
                {o.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-4 px-4 py-3">
                    <span>
                      <span className="font-semibold">
                        {item.quantity}× {item.name}
                      </span>
                      {item.optionsLabel && <span className="block text-xs text-subtle">{item.optionsLabel}</span>}
                    </span>
                    <span className="tabular-nums whitespace-nowrap">{formatGHS(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1.5">
                <Row label="Subtotal" money>{formatGHS(o.subtotal)}</Row>
                {o.fulfilment.method === "delivery" && <Row label="Delivery" money>{formatGHS(o.deliveryFee)}</Row>}
                {(o.platformFee ?? 0) > 0 && <Row label="Service fee" money>{formatGHS(o.platformFee ?? 0)}</Row>}
                {o.discount && (
                  <Row label={`Discount (${o.discount.code})`} money>
                    −{formatGHS(o.discount.amount)}
                  </Row>
                )}
                <div className="flex justify-between pt-2 border-t border-line font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatGHS(o.total)}</dd>
                </div>
              </dl>
            </Section>

            <Section title="Payment">
              <dl className="space-y-1.5">
                <Row label="Status">{o.status === "paid" ? "Paid" : o.status === "pending_payment" ? "Awaiting payment" : "Failed"}</Row>
                {o.payment && (
                  <>
                    <Row label="Method">{o.payment.channel.replace(/_/g, " ")}</Row>
                    {o.payment.paidAt && <Row label="Paid">{dateTime.format(new Date(o.payment.paidAt))}</Row>}
                    <Row label="Paystack ID">{o.payment.transactionId}</Row>
                  </>
                )}
              </dl>
            </Section>

            <Section title="POS (SmartSale)">
              <dl className="space-y-1.5">
                <Row label="Store">{o.smartsale.storeId}</Row>
                <Row label="Status">{o.status === "paid" ? o.smartsale.status : "Waits for payment"}</Row>
                <Row label="Attempts">{o.smartsale.attempts}</Row>
                {o.smartsale.sentAt && <Row label="Sent">{dateTime.format(new Date(o.smartsale.sentAt))}</Row>}
                {o.smartsale.requestKey && <Row label="Request key">{o.smartsale.requestKey}</Row>}
                {o.smartsale.error && <Row label="Last error">{o.smartsale.error}</Row>}
              </dl>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children, money }: { label: string; children: React.ReactNode; money?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-subtle shrink-0">{label}</dt>
      <dd className={`text-right break-words min-w-0 ${money ? "tabular-nums" : ""}`}>{children}</dd>
    </div>
  );
}

function ContactLink({ href, icon, external, children }: { href: string; icon: React.ReactNode; external?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noreferrer" })}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2 font-semibold hover:bg-tint"
    >
      {icon}
      {children}
    </a>
  );
}

// CSV ---------------------------------------------------------------------------

function csvCell(value: string | number) {
  const s = String(value);
  // Quote everything; a leading = + - @ would otherwise run as a formula in Excel.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
}

function downloadCsv(rows: AdminOrder[], from: string, to: string) {
  const headers = [
    "Placed",
    "Reference",
    "Branch",
    "Customer",
    "Phone",
    "Email",
    "Method",
    "Address",
    "Items",
    "Subtotal",
    "Delivery",
    "Service fee",
    "Discount",
    "Total",
    "Payment",
    "Paid with",
    "POS",
  ];
  const lines = rows.map((o) =>
    [
      new Date(o.createdAt).toISOString().replace("T", " ").slice(0, 16),
      o.reference,
      o.branch.name,
      o.customer.fullName,
      o.customer.phone,
      o.customer.email,
      o.fulfilment.method,
      o.fulfilment.method === "delivery" ? o.fulfilment.address : "",
      itemsSummary(o),
      o.subtotal.toFixed(2),
      o.deliveryFee.toFixed(2),
      (o.platformFee ?? 0).toFixed(2),
      (o.discount?.amount ?? 0).toFixed(2),
      o.total.toFixed(2),
      o.status,
      o.payment?.channel ?? "",
      o.status === "paid" ? o.smartsale.status : "",
    ].map(csvCell)
  );
  const csv = [headers.map(csvCell).join(","), ...lines.map((l) => l.join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `bobalicious-orders${from ? `_${from}` : ""}${to ? `_to_${to}` : ""}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

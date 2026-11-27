"use client";

import type { DailySummary } from "@bobashop/api/routers/admin";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Printer, RefreshCw } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { formatGHS } from "@/components/shop/money";
import { useTRPC } from "@/utils/trpc";

const DAY_MS = 86_400_000;

/** Today in Accra. Ghana is on UTC all year. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDay(date: string, days: number) {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

const longDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" });

const CHANNEL_LABELS: Record<string, string> = {
  card: "Card",
  mobile_money: "Mobile money",
  bank: "Bank",
  bank_transfer: "Bank transfer",
  ussd: "USSD",
  qr: "QR",
  apple_pay: "Apple Pay",
  unknown: "Not recorded",
};

export function SummaryBoard() {
  const trpc = useTRPC();
  const [date, setDate] = useState(today);
  const [branchId, setBranchId] = useState("");
  const isToday = date === today();

  const summary = useQuery({
    ...trpc.admin.summary.queryOptions({ date, ...(branchId && { branchId }) }),
    placeholderData: keepPreviousData,
    // Today's numbers keep moving; past days don't.
    refetchInterval: isToday ? 60_000 : false,
  });
  const s = summary.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Daily summary</p>
          <h1 className="font-display text-3xl">{longDate.format(new Date(`${date}T00:00:00Z`))}</h1>
          <p className="mt-1 text-sm text-subtle">
            {branchId ? s?.branchOptions.find((b) => b.id === branchId)?.name : "All branches"} · paid online orders, midnight to
            midnight{isToday ? ", updating every minute" : ""}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="flex items-center rounded-full border border-line bg-card">
            <button
              type="button"
              onClick={() => setDate((d) => shiftDay(d, -1))}
              aria-label="Previous day"
              className="p-2.5 rounded-full hover:bg-tint cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={date}
              max={today()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              aria-label="Day"
              className="bg-transparent text-sm px-1 py-2"
            />
            <button
              type="button"
              onClick={() => setDate((d) => shiftDay(d, 1))}
              disabled={isToday}
              aria-label="Next day"
              className="p-2.5 rounded-full hover:bg-tint disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(today())}
              className="rounded-full border border-line bg-card px-4 py-2.5 text-sm font-semibold hover:bg-tint cursor-pointer"
            >
              Today
            </button>
          )}
          {s && s.branchOptions.length > 1 && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              aria-label="Branch"
              className="rounded-full bg-card border border-line px-4 py-2.5 text-sm"
            >
              <option value="">All branches</option>
              {s.branchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => summary.refetch()}
            aria-label="Refresh"
            className="p-2.5 rounded-full border border-line bg-card hover:bg-tint cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${summary.isFetching ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!s}
            className="inline-flex items-center gap-2 rounded-full bg-brand-deep text-cream px-4 py-2.5 text-sm font-semibold hover:bg-night disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>
      </div>

      {summary.isError ? (
        <p className="rounded-2xl bg-tomato-soft px-4 py-3 text-sm">{summary.error.message}</p>
      ) : !s ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-subtle" />
        </div>
      ) : (
        <Report s={s} isToday={isToday} />
      )}
    </div>
  );
}

function Report({ s, isToday }: { s: DailySummary; isToday: boolean }) {
  return (
    <>
      {/* Headline numbers */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="rounded-[22px] bg-brand-deep text-cream px-6 py-5 print:border print:border-line print:bg-card print:text-ink">
          <p className="text-sm font-semibold text-cream/75 print:text-subtle">Taken {isToday ? "so far today" : "that day"}</p>
          <p className="mt-1 font-display text-5xl tabular-nums">{formatGHS(s.revenue)}</p>
          <Change now={s.revenue} before={s.previousRevenue} />
        </div>
        <Tile label="Paid orders" value={String(s.paidOrders)} note={`${s.counts.placed} started at checkout`} />
        <Tile label="Average order" value={s.paidOrders ? formatGHS(s.averageOrder) : "–"} />
        <Tile label="Items sold" value={String(s.itemsSold)} note={`${s.topItems.length} different items`} />
      </div>

      {s.paidOrders === 0 && s.needsAttention.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-line py-16 text-center">
          <p className="font-display text-xl">No paid orders {isToday ? "yet today" : "that day"}</p>
          <p className="mt-1 text-sm text-subtle">Pick another day with the arrows above.</p>
        </div>
      ) : (
        <>
          <NeedsAttention s={s} />

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Where the money came from">
              <dl className="space-y-2 text-sm">
                <Line label="Food and drinks">{formatGHS(s.breakdown.subtotal)}</Line>
                <Line label="Delivery fees">{formatGHS(s.breakdown.delivery)}</Line>
                <Line label="Platform fees">{formatGHS(s.breakdown.platform)}</Line>
                {s.breakdown.discounts > 0 && <Line label="Discounts">−{formatGHS(s.breakdown.discounts)}</Line>}
                <div className="flex justify-between pt-2 border-t border-line font-semibold">
                  <dt>Total taken</dt>
                  <dd className="tabular-nums">{formatGHS(s.revenue)}</dd>
                </div>
              </dl>
            </Panel>

            <Panel title="Pickup or delivery">
              <Split
                parts={[
                  { label: "Pickup", orders: s.pickup.orders, total: s.pickup.total, tone: "bg-brand" },
                  { label: "Delivery", orders: s.delivery.orders, total: s.delivery.total, tone: "bg-gold" },
                ]}
              />
            </Panel>

            <Panel title="Paid with">
              {s.channels.length === 0 ? (
                <p className="text-sm text-subtle">No payments.</p>
              ) : (
                <dl className="space-y-2 text-sm">
                  {s.channels.map((c) => (
                    <Line key={c.channel} label={`${CHANNEL_LABELS[c.channel] ?? c.channel.replace(/_/g, " ")} · ${c.orders}`}>
                      {formatGHS(c.total)}
                    </Line>
                  ))}
                </dl>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Panel title="Orders by hour">
              <HourChart hours={s.hours} />
            </Panel>

            <Panel title="What sold">
              {s.topItems.length === 0 ? (
                <p className="text-sm text-subtle">Nothing yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-subtle">
                    <tr>
                      <th className="pb-2 font-semibold">Item</th>
                      <th className="pb-2 font-semibold text-right">Qty</th>
                      <th className="pb-2 font-semibold text-right">Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {s.topItems.map((item) => (
                      <tr key={item.name}>
                        <td className="py-2 pr-3">{item.name}</td>
                        <td className="py-2 text-right tabular-nums font-semibold">{item.quantity}</td>
                        <td className="py-2 pl-3 text-right tabular-nums whitespace-nowrap">{formatGHS(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>

          {s.branches.length > 1 && (
            <Panel title="By branch">
              <dl className="space-y-2 text-sm">
                {s.branches.map((b) => (
                  <Line key={b.id} label={`${b.name} · ${b.orders} orders`}>
                    {formatGHS(b.total)}
                  </Line>
                ))}
              </dl>
            </Panel>
          )}
        </>
      )}

      <p className="hidden print:block text-xs text-subtle">Printed {new Date().toLocaleString("en-GB", { timeZone: "Africa/Accra" })}</p>
    </>
  );
}

/** Up or down on the day before. */
function Change({ now, before }: { now: number; before: number }) {
  if (before === 0) {
    return <p className="mt-2 text-sm text-cream/75 print:text-subtle">{now > 0 ? "Nothing taken the day before." : " "}</p>;
  }
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="mt-2 inline-flex items-center gap-1 text-sm text-cream/85 print:text-subtle">
      <Icon className="w-4 h-4" />
      {up ? "+" : ""}
      {pct}% on the day before ({formatGHS(before)})
    </p>
  );
}

function NeedsAttention({ s }: { s: DailySummary }) {
  const stuck = s.needsAttention;
  if (stuck.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-[#E3F1EA] px-4 py-3 text-sm text-[#2C6853] font-semibold">
        <CheckCircle2 className="w-4 h-4" />
        All {s.counts.paid} paid orders reached the POS.
      </p>
    );
  }
  return (
    <div className="rounded-[22px] border border-gold/60 bg-gold-soft px-5 py-4">
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="w-4 h-4" />
        {stuck.length} {stuck.length === 1 ? "order needs" : "orders need"} a look before closing
      </p>
      <ul className="mt-3 divide-y divide-gold/40 text-sm">
        {stuck.map((o) => (
          <li key={o.reference} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
            <span>
              <span className="tabular-nums text-subtle">{time.format(new Date(o.createdAt))}</span>{" "}
              <span className="font-semibold">{o.customer}</span> · {formatGHS(o.total)}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-xs font-semibold">
                {o.problem === "not_in_pos" ? "Paid, but not in the POS" : "Started, not paid"}
              </span>
              <Link
                href={`/admin?q=${encodeURIComponent(o.reference)}` as Route}
                className="font-mono text-xs font-semibold text-brand hover:underline print:no-underline"
              >
                {o.reference}
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card px-5 py-5">
      <p className="text-sm font-semibold text-subtle">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-subtle">{note}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border border-line bg-card px-5 py-5 break-inside-avoid">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-subtle">{title}</h2>
      {children}
    </section>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-subtle">{label}</dt>
      <dd className="tabular-nums text-right whitespace-nowrap">{children}</dd>
    </div>
  );
}

/** A two-part bar with the numbers written out beside it. */
function Split({ parts }: { parts: { label: string; orders: number; total: number; tone: string }[] }) {
  const all = parts.reduce((n, p) => n + p.orders, 0);
  return (
    <div className="space-y-4 text-sm">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-tint">
        {all > 0 &&
          parts.map((p) => p.orders > 0 && <div key={p.label} className={p.tone} style={{ width: `${(p.orders / all) * 100}%` }} />)}
      </div>
      <dl className="space-y-2">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${p.tone}`} aria-hidden />
              {p.label} · {p.orders} {p.orders === 1 ? "order" : "orders"}
              {all > 0 && <span className="text-subtle">({Math.round((p.orders / all) * 100)}%)</span>}
            </dt>
            <dd className="tabular-nums whitespace-nowrap">{formatGHS(p.total)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Paid orders per hour, across the hours the shop actually saw orders (at least 8am to 10pm). */
function HourChart({ hours }: { hours: DailySummary["hours"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const busy = hours.filter((h) => h.orders > 0).map((h) => h.hour);
  const first = Math.min(8, ...busy);
  const last = Math.max(22, ...busy);
  const shown = hours.slice(first, last + 1);
  const max = Math.max(1, ...shown.map((h) => h.orders));
  const peak = shown.reduce((best, h) => (h.orders > best.orders ? h : best), shown[0]!);
  const label = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
  const active = hover === null ? null : hours[hover];

  return (
    <div>
      <p className="mb-3 h-5 text-sm">
        {active ? (
          <>
            <strong>
              {label(active.hour)}–{label((active.hour + 1) % 24)}
            </strong>{" "}
            · {active.orders} {active.orders === 1 ? "order" : "orders"} · {formatGHS(active.total)}
          </>
        ) : peak.orders > 0 ? (
          <span className="text-subtle">
            Busiest: <strong className="text-ink">{label(peak.hour)}</strong>, {peak.orders} {peak.orders === 1 ? "order" : "orders"}
          </span>
        ) : (
          <span className="text-subtle">No paid orders.</span>
        )}
      </p>
      <div className="flex h-40 items-end gap-0.5 border-b border-line" onMouseLeave={() => setHover(null)}>
        {shown.map((h) => (
          <button
            key={h.hour}
            type="button"
            onMouseEnter={() => setHover(h.hour)}
            onFocus={() => setHover(h.hour)}
            onBlur={() => setHover(null)}
            aria-label={`${label(h.hour)}: ${h.orders} orders, ${formatGHS(h.total)}`}
            className="group flex h-full flex-1 items-end cursor-default"
          >
            <span
              className={`block w-full rounded-t-[4px] transition-colors ${
                h.orders === 0 ? "" : hover === h.hour ? "bg-brand-deep" : "bg-brand group-hover:bg-brand-deep"
              }`}
              style={{ height: h.orders ? `${(h.orders / max) * 100}%` : 0 }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex gap-0.5 text-[10px] text-subtle tabular-nums">
        {shown.map((h) => (
          <span key={h.hour} className="flex-1 text-center">
            {h.hour % 3 === 0 ? String(h.hour).padStart(2, "0") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

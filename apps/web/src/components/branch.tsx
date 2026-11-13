"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, ChevronDown, MapPin, MessageCircle, Phone, X } from "lucide-react";
import { BRANCHES, SHOP, findBranch, type Branch } from "@bobashop/api/data/shop";

const STORAGE_KEY = "bobalicious.branch";
const DISMISSED_KEY = "bobalicious.branch-dismissed";

interface BranchContextType {
  /** The branch the customer is ordering from, once they've picked one. */
  branch: Branch | undefined;
  setBranchId: (id: string) => void;
  openPicker: () => void;
  /** The chosen branch's numbers, or the main line before one is chosen. */
  contact: { phone: string; telHref: string; whatsapp: string };
}

const BranchContext = createContext<BranchContextType | null>(null);

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode: the choice lasts for this visit only.
  }
}

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branchId, setId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Read the saved branch after mount so server and first client render match.
  // A first-time visitor gets the picker once; closing it doesn't bring it back.
  useEffect(() => {
    const saved = read(STORAGE_KEY);
    if (findBranch(saved)) setId(saved);
    else if (!read(DISMISSED_KEY)) {
      const t = setTimeout(() => setPickerOpen(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const setBranchId = useCallback((id: string) => {
    setId(id);
    write(STORAGE_KEY, id);
  }, []);

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    write(DISMISSED_KEY, "1");
  }, []);

  const branch = findBranch(branchId);
  const value = useMemo<BranchContextType>(
    () => ({
      branch,
      setBranchId,
      openPicker: () => setPickerOpen(true),
      contact: branch ?? { phone: SHOP.phone, telHref: SHOP.telHref, whatsapp: SHOP.whatsapp },
    }),
    [branch, setBranchId]
  );

  return (
    <BranchContext.Provider value={value}>
      {children}
      <BranchPicker
        open={pickerOpen}
        current={branch?.id}
        onClose={closePicker}
        onChoose={(id) => {
          setBranchId(id);
          closePicker();
        }}
      />
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used inside BranchProvider");
  return ctx;
}

/** Header pill: "North Kaneshie ▾", or a prompt to choose one. */
export function BranchButton({ className = "" }: { className?: string }) {
  const { branch, openPicker } = useBranch();
  return (
    <button
      type="button"
      onClick={openPicker}
      className={`inline-flex items-center gap-1.5 min-h-10 pl-3 pr-2.5 rounded-full bg-gold/90 hover:bg-gold text-ink text-sm font-medium cursor-pointer transition-colors ${className}`}
      aria-label={branch ? `Ordering from ${branch.name}. Change branch` : "Choose your branch"}
    >
      <MapPin className="w-4 h-4 shrink-0" strokeWidth={2} />
      <span className="truncate max-w-[12rem]">{branch ? branch.name : "Choose branch"}</span>
      <ChevronDown className="w-4 h-4 shrink-0" strokeWidth={2} />
    </button>
  );
}

function BranchPicker({
  open,
  current,
  onClose,
  onChoose,
}: {
  open: boolean;
  current: string | undefined;
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-night/70 p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-picker-title"
            className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-paper rounded-t-[28px] sm:rounded-[28px] shadow-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gold px-6 sm:px-8 pt-7 pb-6">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 w-11 h-11 rounded-full flex items-center justify-center hover:bg-ink/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <p className="text-sm font-medium text-ink/70">Hey there</p>
              <h2 id="branch-picker-title" className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-ink leading-tight">
                Which Bobalicious is closest?
              </h2>
              <p className="mt-2 text-[15px] text-ink/75">Pick a branch for pickup or delivery. You can change it any time.</p>
            </div>

            <ul className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BRANCHES.map((b) => {
                const selected = b.id === current;
                return (
                  <li key={b.id}>
                    <div
                      className={`h-full rounded-2xl border-2 p-4 flex flex-col gap-3 transition-colors ${
                        selected ? "border-brand bg-gold-soft" : "border-line bg-card hover:border-brand/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-xl font-semibold leading-tight">{b.name}</p>
                          <p className="mt-1 text-sm text-subtle flex gap-1.5">
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
                            {b.address}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {!b.orderingOpen && <span className="rounded-full bg-tomato-soft text-tomato-dark px-2.5 py-1 text-xs font-semibold">Not taking orders</span>}
                            <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-medium">{b.kitchen === "full" ? "Drinks + full food menu" : "Drinks + bites"}</span>
                            <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-medium">
                              {b.delivery.enabled ? `Delivery up to ${b.delivery.maxKm} km` : "Pickup only"}
                            </span>
                          </div>
                        </div>
                        {selected && (
                          <span className="shrink-0 w-7 h-7 rounded-full bg-brand text-cream flex items-center justify-center">
                            <Check className="w-4 h-4" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onChoose(b.id)}
                          className="flex-1 min-h-11 rounded-full bg-brand text-cream hover:bg-brand-dark text-sm font-medium cursor-pointer"
                        >
                          {selected ? "Ordering here" : "Order from here"}
                        </button>
                        <a
                          href={b.telHref}
                          aria-label={`Call ${b.name}, ${b.phone}`}
                          className="w-11 h-11 rounded-full border border-line hover:border-ink flex items-center justify-center"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://wa.me/${b.whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`WhatsApp ${b.name}`}
                          className="w-11 h-11 rounded-full border border-line hover:border-ink flex items-center justify-center"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="px-6 pb-6 -mt-1 text-center text-sm text-subtle">
              <button type="button" onClick={onClose} className="underline underline-offset-4 hover:text-ink cursor-pointer min-h-11">
                Just looking for now
              </button>
            </p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

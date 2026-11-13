"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Clock, MapPin, MessageCircle, Navigation, Phone, PartyPopper } from "lucide-react";
import { BRANCHES, SHOP, findBranch } from "@bobashop/api/data/shop";
import { Breadcrumb } from "@/components/arrow-button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { useBranch } from "@/components/branch";

const TOPICS = ["An order", "Allergies", "Party or office order", "Feedback", "Something else"];

const directions = (query: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
const wa = (number: string, text?: string) => `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export default function ContactPage() {
  const { branch, setBranchId, openPicker } = useBranch();
  // The form's branch starts on the one chosen in the picker but can be changed here alone.
  const [to, setTo] = useState<string>(branch?.id ?? "");
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (branch && !to) setTo(branch.id);
  }, [branch, to]);

  const target = findBranch(to);

  // The site has no inbox of its own: WhatsApp opens with the message written, and the
  // customer taps send. It reaches the branch's own WhatsApp, where orders already go.
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = !target
      ? "Choose which branch to message"
      : name.trim().length < 2
        ? "Tell us your name"
        : message.trim().length < 5
          ? "Write a short message"
          : null;
    setError(problem);
    if (problem || !target) return;
    const text = `Hi Bobalicious ${target.name}, this is ${name.trim()}.\n\n${topic}: ${message.trim()}`;
    window.open(wa(target.whatsapp, text), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="pb-24">
      {/* Banner */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-5">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <div className="mt-5 relative overflow-hidden rounded-[32px] bg-brand-deep text-cream">
          <div className="absolute inset-0">
            <Image src="/images/story-oreo.jpg" alt="" fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover object-[75%_40%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/90 md:via-brand-deep/60 to-transparent" />
          </div>
          <div className="relative px-6 sm:px-12 py-12 sm:py-16 max-w-[620px] flex flex-col gap-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Contact</p>
            <h1 className="font-display font-bold text-[48px] sm:text-[72px] leading-[0.95]">Talk to us</h1>
            <p className="text-lg text-cream/80 max-w-[480px]">
              Questions about an order, allergies or a big order for a party? Every branch answers its own phone and WhatsApp.
            </p>
            {branch ? (
              <div className="flex flex-wrap gap-3">
                <a href={wa(branch.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 min-h-13 px-6 rounded-full bg-gold text-ink hover:bg-[#f39c0a] font-medium">
                  <MessageCircle className="w-5 h-5" strokeWidth={2} /> WhatsApp {branch.name}
                </a>
                <a href={branch.telHref} className="inline-flex items-center gap-2 min-h-13 px-6 rounded-full border border-cream/50 hover:bg-cream hover:text-ink font-medium transition-colors">
                  <Phone className="w-5 h-5" strokeWidth={2} /> {branch.phone}
                </a>
                <button type="button" onClick={openPicker} className="min-h-13 px-2 text-cream/75 hover:text-cream underline underline-offset-4 cursor-pointer">
                  Change branch
                </button>
              </div>
            ) : (
              <button type="button" onClick={openPicker} className="self-start inline-flex items-center gap-2 min-h-13 px-6 rounded-full bg-gold text-ink hover:bg-[#f39c0a] font-medium cursor-pointer">
                <MapPin className="w-5 h-5" strokeWidth={2} /> Choose your branch
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Our branches</p>
            <h2 className="mt-2 font-display font-bold text-[36px] sm:text-5xl leading-none text-brand-deep">Call, WhatsApp or visit</h2>
          </div>
          <p className="flex items-center gap-2 text-subtle">
            <Clock className="w-4 h-4" /> {SHOP.hours.map((h) => `${h.days.replace(" – ", "–")} ${h.time}`).join(" · ")}
          </p>
        </Reveal>
        <RevealGroup className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BRANCHES.map((b) => {
            const mine = branch?.id === b.id;
            return (
              <RevealItem
                key={b.id}
                className={`rounded-[26px] border p-6 flex flex-col gap-4 ${mine ? "bg-gold-soft border-gold" : "bg-card border-line"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl font-semibold leading-tight">{b.name}</h3>
                    <p className="mt-1.5 flex gap-1.5 text-[15px] text-subtle">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> {b.address}
                    </p>
                  </div>
                  {mine ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand text-cream text-xs font-semibold px-2.5 py-1">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} /> Your branch
                    </span>
                  ) : (
                    <button type="button" onClick={() => setBranchId(b.id)} className="shrink-0 text-sm font-medium text-brand hover:underline underline-offset-4 cursor-pointer min-h-8">
                      Make mine
                    </button>
                  )}
                </div>
                <a href={b.telHref} className="font-display text-xl font-semibold text-brand-deep hover:text-brand self-start">
                  {b.phone}
                </a>
                <div className="mt-auto grid grid-cols-3 gap-2">
                  <a href={b.telHref} className="min-h-11 rounded-full border border-line bg-paper hover:border-brand-deep flex items-center justify-center gap-1.5 text-sm font-medium">
                    <Phone className="w-4 h-4" /> Call
                  </a>
                  <a href={wa(b.whatsapp)} target="_blank" rel="noreferrer" className="min-h-11 rounded-full bg-brand-deep text-cream hover:bg-night flex items-center justify-center gap-1.5 text-sm font-medium">
                    <MessageCircle className="w-4 h-4" /> Chat
                  </a>
                  <a href={directions(b.mapQuery)} target="_blank" rel="noreferrer" className="min-h-11 rounded-full border border-line bg-paper hover:border-brand-deep flex items-center justify-center gap-1.5 text-sm font-medium">
                    <Navigation className="w-4 h-4" /> Map
                  </a>
                </div>
              </RevealItem>
            );
          })}
          <RevealItem className="rounded-[26px] bg-tomato text-white p-6 flex flex-col gap-3">
            <PartyPopper className="w-7 h-7" />
            <h3 className="font-display text-2xl font-semibold leading-tight">Party, office or event?</h3>
            <p className="text-white/85 text-[15px]">Tell us the date, how many cups and what you&apos;re thinking. We&apos;ll put a quote together.</p>
            <button
              type="button"
              onClick={() => {
                setTopic("Party or office order");
                document.getElementById("message")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mt-auto self-start min-h-11 px-5 rounded-full bg-gold text-ink hover:bg-[#f39c0a] text-sm font-semibold cursor-pointer"
            >
              Ask for a quote
            </button>
          </RevealItem>
        </RevealGroup>
      </section>

      {/* Message */}
      <section id="message" className="max-w-[1280px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20 scroll-mt-24">
        <Reveal className="rounded-[32px] bg-card border border-line grid lg:grid-cols-[0.9fr_1.1fr] overflow-hidden">
          <div className="bg-brand-deep text-cream p-7 sm:p-10 flex flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Message a branch</p>
            <h2 className="font-display font-bold text-[34px] sm:text-[44px] leading-[1.02]">Write it here, send it on WhatsApp</h2>
            <p className="text-cream/80 leading-relaxed">
              Pick a branch and write your message. WhatsApp opens with it ready, you tap send, and it goes straight to that branch&apos;s
              team. That&apos;s where they answer orders, so it&apos;s the quickest way to reach them.
            </p>
            <ol className="mt-2 flex flex-col gap-3 text-[15px]">
              {["Choose a branch", "Write your message", "Tap send in WhatsApp"].map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-gold text-ink font-display font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <form onSubmit={send} noValidate className="p-6 sm:p-10 flex flex-col gap-6">
            <fieldset>
              <legend className="text-sm font-semibold mb-3">Which branch?</legend>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map((b) => (
                  <button key={b.id} type="button" onClick={() => setTo(b.id)} aria-pressed={to === b.id} className={pill(to === b.id)}>
                    {b.name}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold mb-3">What&apos;s it about?</legend>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button key={t} type="button" onClick={() => setTopic(t)} aria-pressed={topic === t} className={pill(topic === t)}>
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="block text-sm font-semibold mb-2">Your name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ama Mensah" className={field} />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold mb-2">Message</span>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  topic === "Party or office order"
                    ? "The date, how many cups, pickup or delivery, and anything else"
                    : "Your order reference, the drink, or anything else"
                }
                className={field}
              />
            </label>

            {error && (
              <p role="alert" className="text-sm font-medium text-sale">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button type="submit" className="self-start inline-flex items-center gap-2 min-h-13 px-7 rounded-full bg-[#1f9d55] hover:bg-[#178246] text-white font-semibold cursor-pointer">
                <MessageCircle className="w-5 h-5" strokeWidth={2} /> {target ? `Send to ${target.name} on WhatsApp` : "Send on WhatsApp"}
              </button>
              <p className="text-sm text-subtle">Nothing is sent until you tap send in WhatsApp.</p>
            </div>
          </form>
        </Reveal>
      </section>
    </div>
  );
}

const pill = (active: boolean) =>
  `min-h-10 px-4 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
    active ? "bg-brand-deep border-brand-deep text-cream" : "bg-paper border-line hover:border-brand-deep"
  }`;

const field =
  "w-full rounded-2xl bg-paper border border-line px-4 py-3.5 text-base focus:outline-none focus:border-brand focus:ring-3 focus:ring-brand/15";

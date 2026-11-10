"use client";

import React, { useState } from "react";
import { ArrowUpRight, Clock, Mail, MapPin, MessageCircle, Navigation, Phone, Send } from "lucide-react";
import { Eyebrow } from "@/components/arrow-button";
import { SHOP } from "@bobashop/api/data/shop";
import { RevealSection } from "@/components/motion/reveal";
import { Cup } from "@/components/shop/product-art";

const SUBJECTS = [
  "Help with an order",
  "Allergies and ingredients",
  "Large order (office, party, event)",
  "Feedback on a drink",
  "Something else",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const composed = () =>
    `Hello ${SHOP.name},\n\n${message.trim()}\n\n${name.trim()}${email.trim() ? `\n${email.trim()}` : ""}`;

  const validate = () => {
    if (name.trim().length < 2) return "Tell us your name";
    if (!EMAIL_RE.test(email.trim())) return "Enter an email we can reply to";
    if (message.trim().length < 5) return "Write a short message";
    return null;
  };

  // No mail server is wired up yet, so the message is handed to the visitor's own
  // email app or WhatsApp, already written, rather than pretending to send it.
  const sendByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;
    window.location.href = `mailto:${SHOP.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(composed())}`;
  };

  const sendOnWhatsApp = () => {
    const problem = validate();
    setError(problem);
    if (problem) return;
    window.open(
      `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`${subject}\n\n${composed()}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const channels = [
    { href: SHOP.telHref, icon: Phone, title: "Call us", text: SHOP.phone, style: "bg-paper text-ink" },
    {
      href: `https://wa.me/${SHOP.whatsapp}`,
      icon: MessageCircle,
      title: "WhatsApp",
      text: "Quickest for orders and questions",
      style: "bg-brand text-cream",
      external: true,
    },
    { href: `mailto:${SHOP.email}`, icon: Mail, title: "Email", text: SHOP.email, style: "bg-ink text-cream" },
  ];

  return (
    <div className="flex flex-col min-h-screen text-ink">
      <section className="bg-brand-deep text-cream">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-16 sm:py-24 flex flex-wrap items-center gap-12">
          <div className="flex-[1_1_480px] min-w-0">
            <Eyebrow tone="light">contact</Eyebrow>
            <h1 className="mt-6 font-display font-light uppercase text-[60px] sm:text-[88px] lg:text-[104px] leading-[0.92] tracking-[0.01em]">
              Talk
              <br />
              to us
            </h1>
            <p className="mt-6 text-[17px] sm:text-xl text-cream/80 max-w-lg leading-relaxed">
              A question about an order, an allergy, or a big order for the office? Pick whichever way suits you.
            </p>
          </div>
          <div className="flex-[0_1_340px] mx-auto">
            <Cup color="#8FA45A" className="w-full h-auto max-w-[340px]" />
          </div>
        </div>
      </section>

      <div className="mt-3 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        {channels.map(({ href, icon: Icon, title, text, style, external }) => (
          <a
            key={title}
            href={href}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            className={`group rounded-[28px] p-6 sm:p-8 flex sm:flex-col sm:items-start items-center gap-4 sm:gap-10 transition-transform hover:-translate-y-1 ${style}`}
          >
            <span className="w-12 h-12 bg-current/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" />
            </span>
            <span className="block min-w-0 flex-1">
              <span className="block font-display text-2xl sm:text-3xl font-normal">{title}</span>
              <span className="block mt-1 opacity-75 truncate">{text}</span>
            </span>
            <ArrowUpRight className="w-6 h-6 shrink-0 transition-transform group-hover:rotate-45 sm:hidden" />
          </a>
        ))}
      </div>

      <RevealSection className="mt-3 sm:mt-5 bg-paper px-4 sm:px-8 lg:px-12 py-10 sm:py-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4 sm:gap-6 items-start">
          {/* Visit */}
          <div className="bg-card border border-line overflow-hidden">
            <iframe
              title={`Map showing ${SHOP.name}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(SHOP.mapQuery)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-56 sm:h-64 border-0 bg-tint"
            />
            <div className="p-6 sm:p-7 space-y-6">
              <div className="flex gap-4">
                <span className="w-11 h-11 bg-tint text-brand flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-display font-normal">Visit the shop</p>
                  <p className="text-subtle">{SHOP.address}</p>
                  <p className="font-mono text-sm text-subtle mt-0.5">{SHOP.ghanaPostGps}</p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SHOP.mapQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline underline-offset-4"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Get directions
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-11 h-11 bg-gold-soft text-gold-dark flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <p className="font-display font-normal">Opening hours</p>
                  <dl className="mt-1 space-y-1 text-sm">
                    {SHOP.hours.map((h) => (
                      <div key={h.days} className="flex justify-between gap-4">
                        <dt className="text-subtle">{h.days}</dt>
                        <dd className="font-medium">{h.time}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <form onSubmit={sendByEmail} noValidate className="bg-card border border-line p-6 sm:p-9">
            <h2 className="font-display text-3xl sm:text-5xl font-light uppercase tracking-[0.02em]">Send us a message</h2>
            <p className="mt-1.5 text-subtle">We usually reply within one working day.</p>

            <fieldset className="mt-7">
              <legend className="text-sm font-semibold mb-3">What&apos;s it about?</legend>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    aria-pressed={subject === s}
                    className={`px-4 py-2 text-sm font-medium border transition-colors cursor-pointer ${
                      subject === s ? "bg-brand border-brand text-white" : "border-line hover:border-ink/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="block">
                <span className="block text-sm font-semibold mb-2">Your name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" className={fieldClass} />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold mb-2">Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className={fieldClass} />
              </label>
            </div>
            <label className="block mt-5">
              <span className="block text-sm font-semibold mb-2">Message</span>
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your order number, the drinks you need, the date, or anything else"
                className={fieldClass}
              />
            </label>

            {error && <p role="alert" className="mt-4 text-sm font-medium text-sale">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3.5 transition-colors cursor-pointer">
                <Send className="w-4 h-4" /> Send by email
              </button>
              <button type="button" onClick={sendOnWhatsApp} className="inline-flex items-center gap-2 border border-ink/20 hover:border-ink font-semibold px-6 py-3.5 transition-colors cursor-pointer">
                <MessageCircle className="w-4 h-4" /> Send on WhatsApp
              </button>
            </div>
            <p className="mt-3 text-xs text-subtle">Opens your email app or WhatsApp with your message ready to send.</p>
          </form>
        </div>
      </RevealSection>
    </div>
  );
}

const fieldClass =
  "w-full bg-paper border border-line  px-4 py-3.5 text-base focus:outline-none focus:border-brand focus:ring-3 focus:ring-brand/10";

import React from "react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

const STEPS = [
  {
    title: "Pick your favourites",
    text: "Choose your drink, your sweetness, your ice and your pearls. Add pizza or bites on the side.",
    Art: PickArt,
  },
  {
    title: "Pay your way",
    text: "Mobile money, card or bank transfer. Your branch gets the order the moment you pay.",
    Art: PayArt,
  },
  {
    title: "Grab it or get it",
    text: "Pick up in about 15 minutes, or we bring it to your door. Cold, fresh and ready to sip.",
    Art: DeliverArt,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-card border-y border-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-20 sm:py-24 flex flex-col gap-12">
        <Reveal className="text-center flex flex-col items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">How it works</p>
          <h2 className="font-display font-bold text-[40px] sm:text-6xl leading-none text-brand-deep">Three easy steps</h2>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map(({ title, text, Art }, i) => (
            <RevealItem key={title} className="flex flex-col items-center text-center gap-5">
              <div className="relative w-full aspect-[4/3] rounded-[28px] bg-paper overflow-hidden">
                <span className="absolute left-4 top-4 z-10 w-10 h-10 rounded-xl bg-brand-deep text-gold font-display font-bold flex items-center justify-center shadow-md">
                  0{i + 1}
                </span>
                <Art />
              </div>
              <div className="flex flex-col gap-2 max-w-[320px]">
                <h3 className="font-display text-2xl font-semibold">{title}</h3>
                <p className="text-[15px] leading-relaxed text-subtle">{text}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* Spot illustrations, drawn for Bobalicious in the brand colours. */

const C = {
  mango: "#FBAD1C",
  mangoSoft: "#FDE9BF",
  purple: "#341830",
  brown: "#884C2B",
  cream: "#FFF7E8",
  red: "#D22A1F",
  pink: "#F4B6BF",
  taro: "#B39BC8",
  leaf: "#3F6B45",
};

function Pearls({ x, y }: { x: number; y: number }) {
  return (
    <g fill={C.purple}>
      <circle cx={x} cy={y} r="5" />
      <circle cx={x + 12} cy={y + 3} r="5" />
      <circle cx={x + 6} cy={y - 7} r="5" />
      <circle cx={x + 19} cy={y - 6} r="5" />
    </g>
  );
}

function PickArt() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" aria-hidden>
      <path d="M40 210C20 140 70 60 160 50s200 10 210 90-40 150-140 150S60 280 40 210z" fill={C.mangoSoft} />
      {/* plant */}
      <path d="M70 270c-6-40 4-70 22-90-4 30-2 60 6 90z" fill={C.leaf} />
      <path d="M86 270c4-34 22-58 44-70-14 26-22 48-24 70z" fill={C.leaf} opacity=".75" />
      {/* phone */}
      <rect x="140" y="40" width="130" height="236" rx="22" fill={C.purple} />
      <rect x="150" y="54" width="110" height="206" rx="14" fill={C.cream} />
      <rect x="186" y="46" width="38" height="5" rx="2.5" fill={C.cream} opacity=".4" />
      {/* cup on screen */}
      <path d="M180 100h50l-6 74a8 8 0 0 1-8 7h-22a8 8 0 0 1-8-7z" fill={C.taro} />
      <rect x="176" y="92" width="58" height="10" rx="5" fill={C.brown} />
      <path d="M212 92l8-28" stroke={C.brown} strokeWidth="5" strokeLinecap="round" />
      <Pearls x={190} y={166} />
      {/* option chips */}
      <rect x="162" y="196" width="40" height="14" rx="7" fill={C.mango} />
      <rect x="208" y="196" width="40" height="14" rx="7" fill={C.mangoSoft} />
      <rect x="162" y="218" width="86" height="26" rx="13" fill={C.red} />
      <rect x="186" y="228" width="38" height="6" rx="3" fill={C.cream} />
      {/* hand */}
      <path d="M252 210c18-6 40 4 48 22l18 44h-84l-6-30c-2-16 10-32 24-36z" fill="#8A5A3E" />
      <rect x="232" y="196" width="34" height="14" rx="7" fill="#8A5A3E" />
      <rect x="232" y="214" width="30" height="13" rx="6.5" fill="#8A5A3E" />
      {/* floating hearts */}
      <Heart x={312} y={86} s={1.1} />
      <Heart x={96} y={96} s={0.8} />
      <circle cx="330" cy="160" r="7" fill={C.purple} />
      <circle cx="110" cy="160" r="5" fill={C.mango} />
    </svg>
  );
}

function PayArt() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" aria-hidden>
      <path d="M60 180c-20-70 40-140 140-140s170 50 160 130-80 120-170 110S80 250 60 180z" fill={C.mangoSoft} />
      {/* card */}
      <g transform="rotate(-14 170 150)">
        <rect x="70" y="100" width="190" height="120" rx="16" fill={C.brown} />
        <rect x="70" y="128" width="190" height="22" fill={C.purple} />
        <rect x="88" y="170" width="44" height="30" rx="6" fill={C.mango} />
        <rect x="148" y="178" width="90" height="8" rx="4" fill={C.cream} opacity=".6" />
      </g>
      {/* phone with tick */}
      <rect x="210" y="60" width="110" height="200" rx="20" fill={C.purple} />
      <rect x="219" y="72" width="92" height="176" rx="12" fill={C.cream} />
      <circle cx="265" cy="140" r="30" fill={C.leaf} />
      <path d="M251 141l10 10 19-21" stroke={C.cream} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="235" y="190" width="60" height="9" rx="4.5" fill={C.purple} opacity=".2" />
      <rect x="243" y="206" width="44" height="9" rx="4.5" fill={C.purple} opacity=".12" />
      {/* coins */}
      <Coin x={344} y={92} />
      <Coin x={110} y={248} />
      <Coin x={350} y={226} small />
      <circle cx="96" cy="74" r="8" fill={C.red} />
    </svg>
  );
}

function DeliverArt() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" aria-hidden>
      <path d="M40 190c0-80 70-150 170-150s160 60 150 140-70 110-160 110S40 260 40 190z" fill={C.mangoSoft} />
      <circle cx="310" cy="80" r="26" fill={C.mango} />
      {/* road */}
      <rect x="30" y="262" width="340" height="8" rx="4" fill={C.purple} opacity=".15" />
      {/* scooter */}
      <circle cx="120" cy="240" r="24" fill={C.purple} />
      <circle cx="120" cy="240" r="9" fill={C.cream} />
      <circle cx="280" cy="240" r="24" fill={C.purple} />
      <circle cx="280" cy="240" r="9" fill={C.cream} />
      <path d="M96 236c0-30 20-48 56-48h56l26 -50h18l-24 60c30 0 52 16 56 38z" fill={C.red} />
      <rect x="240" y="128" width="34" height="10" rx="5" fill={C.purple} />
      {/* box on the back */}
      <rect x="86" y="140" width="72" height="54" rx="8" fill={C.mango} />
      <rect x="86" y="156" width="72" height="8" fill={C.brown} opacity=".6" />
      <circle cx="122" cy="178" r="7" fill={C.purple} />
      {/* rider */}
      <path d="M176 188l16-66c4-14 26-16 32 0l10 40-20 4-8-22-10 44z" fill={C.purple} />
      <path d="M200 122c10-4 24 6 28 24l-34 6z" fill={C.mango} />
      <path d="M206 160l40 4-4 26-38-6z" fill={C.purple} />
      <circle cx="208" cy="100" r="20" fill={C.brown} />
      <path d="M188 98a20 20 0 0 1 40 0z" fill={C.purple} />
      <path d="M218 132l28 4" stroke={C.brown} strokeWidth="9" strokeLinecap="round" />
      {/* cup in hand */}
      <path d="M248 118h22l-3 26h-16z" fill={C.taro} />
      <rect x="246" y="113" width="26" height="6" rx="3" fill={C.brown} />
      {/* speed lines */}
      <path d="M40 200h36M30 216h40M48 184h24" stroke={C.purple} strokeWidth="5" strokeLinecap="round" opacity=".25" />
    </svg>
  );
}

function Heart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="18" fill={C.cream} />
      <path d="M0 9c-9-6-13-10-13-15a6.5 6.5 0 0 1 13-2 6.5 6.5 0 0 1 13 2c0 5-4 9-13 15z" fill={C.red} />
    </g>
  );
}

function Coin({ x, y, small = false }: { x: number; y: number; small?: boolean }) {
  const r = small ? 13 : 18;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={C.mango} />
      <circle r={r - 5} fill="none" stroke={C.brown} strokeWidth="2.5" opacity=".6" />
      <text textAnchor="middle" dy={small ? 4 : 6} fontSize={small ? 11 : 15} fontWeight="700" fill={C.brown} fontFamily="sans-serif">
        ₵
      </text>
    </g>
  );
}

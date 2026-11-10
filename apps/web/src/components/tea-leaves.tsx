import React from "react";

// One tea leaf, drawn pointing right from its stalk at (0,0): outline, midrib, veins and a
// little hatching, in the engraved style of an old botanical plate.
function Leaf({ x, y, rotate, scale = 1 }: { x: number; y: number; rotate: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0 0 C16 -20 58 -30 124 -6 C100 6 70 24 36 24 C18 24 6 13 0 0 Z" />
      <path d="M3 1 Q62 -2 120 -6" />
      <path d="M22 0 Q30 -10 42 -17 M42 -1 Q52 -13 66 -20 M62 -2 Q74 -13 88 -17 M82 -3 Q94 -10 106 -11" />
      <path d="M26 2 Q36 12 48 18 M46 1 Q58 12 72 16 M68 0 Q80 9 94 10 M88 -2 Q98 4 110 3" />
      <path d="M30 -8 l6 -3 M50 -11 l7 -3 M72 -11 l7 -2 M34 12 l6 3 M56 12 l7 3 M78 9 l6 2" strokeWidth="0.8" />
    </g>
  );
}

/** A sprig of tea leaves: stem, six leaves and a bud. */
function Sprig() {
  return (
    <>
      <path d="M18 392 C70 330 120 270 170 205 C210 152 250 104 312 52" />
      <path d="M170 205 C150 186 132 172 104 166" />
      <Leaf x={312} y={52} rotate={-38} scale={0.9} />
      <Leaf x={262} y={96} rotate={-112} scale={0.95} />
      <Leaf x={250} y={108} rotate={-4} scale={1.15} />
      <Leaf x={104} y={166} rotate={-150} scale={1.05} />
      <Leaf x={176} y={198} rotate={18} scale={1.25} />
      <Leaf x={96} y={300} rotate={-128} scale={1.1} />
      <Leaf x={70} y={330} rotate={24} scale={0.9} />
      <path d="M312 52 C326 40 340 36 352 38 C342 46 330 52 312 52 Z" />
    </>
  );
}

/**
 * Faint line-drawn tea leaves for the cream backgrounds. Purely decorative: hidden from
 * screen readers and never catches clicks. Position it with `className`.
 */
export function TeaLeaves({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="-10 -70 480 480"
      aria-hidden
      focusable="false"
      className={`pointer-events-none select-none text-[#C9BFAD] ${className}`}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <Sprig />
      </g>
    </svg>
  );
}

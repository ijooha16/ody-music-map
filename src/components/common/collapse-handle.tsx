"use client";

interface CollapseHandleProps {
  side: "left" | "right";

  pointing: "left" | "right";
  onClick: () => void;

  expanded: boolean;
  title: string;

  hitClassName?: string;
}

export const HANDLE_W = 22;

const W = HANDLE_W;

const H = 76;

const SLANT = 3;

const R = 8;

const CLIP = `path("M0 0 L${W - R} ${SLANT} A${R} ${R} 0 0 1 ${W} ${SLANT + R} L${W} ${H - SLANT - R} A${R} ${R} 0 0 1 ${W - R} ${H - SLANT} L0 ${H} Z")`;

export default function CollapseHandle({ side, pointing, onClick, expanded, title, hitClassName = "" }: CollapseHandleProps) {
  const outerRight = side === "right";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      title={title}
      aria-label={title}
      style={{ width: W, height: H, [outerRight ? "right" : "left"]: -W }}
      className={`glass-handle-host absolute top-1/2 z-10 grid -translate-y-1/2 place-items-center text-teal drop-shadow-[0_0_11px_rgba(79,227,206,.7)] transition-[color,filter] hover:text-ink hover:drop-shadow-[0_0_16px_rgba(79,227,206,.95)] ${hitClassName}`}
    >

      <span aria-hidden style={{ clipPath: CLIP, transform: outerRight ? undefined : "scaleX(-1)" }} className="glass-handle absolute inset-0" />
      <svg className="relative" width="13" height="13" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={pointing === "left" ? "M6.5 1.5 3 5l3.5 3.5" : "M3.5 1.5 7 5 3.5 8.5"} />
      </svg>
    </button>
  );
}

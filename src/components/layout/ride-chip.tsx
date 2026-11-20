import type { ReactNode } from "react";

const DOT = {
  teal: "bg-teal shadow-[0_0_10px_#4fe3ce]",
  violet: "bg-violet shadow-[0_0_10px_#a67cff]",
  warn: "bg-warn shadow-[0_0_10px_#ffc46b]",
} as const;

export default function RideChip({ dot, children, action }: { dot: keyof typeof DOT; children: ReactNode; action: ReactNode }) {
  return (
    <div className="pointer-events-auto hidden w-fit max-w-[calc(100dvw-2*var(--spacing-gutter-sm))] items-center gap-1.5 max-tablet:flex">
      <div className="glass-liquid flex min-w-0 items-center gap-2 rounded-pill! py-[5px] px-3 [--glass-tint:rgb(6_9_17/0.45)]">
        <span
          className={`animate-pulse-dot h-1.5 w-1.5 shrink-0 rounded-pill ${DOT[dot]}`}
        />
        <span className="min-w-0 truncate text-[13.5px] leading-6">{children}</span>
      </div>
      {action}
    </div>
  );
}

export const RIDE_CHIP_ACTION =
  "glass-liquid h-[34px] shrink-0 rounded-pill! border-bad/35! px-3 text-[12.5px] whitespace-nowrap text-[#ffb3bd] [--glass-tint:rgb(72_14_28/0.6)] hover:[--glass-tint:rgb(96_18_36/0.7)] disabled:opacity-50";

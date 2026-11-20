"use client";

import { LAYER_AXES } from "@/constants";
import { useMapStore } from "@/stores/use-map-store";

function Point({ len, wide, rotate, bright, dim }: { len: number; wide: number; rotate: number; bright: number; dim: number }) {
  const tip = 60 - len;
  const base = 60 - wide * 1.6;
  return (
    <g transform={`rotate(${rotate} 60 60)`}>
      <polygon points={`60,${tip} ${60 - wide},${base} 60,60`} fill="#ffffff" fillOpacity={bright} />
      <polygon points={`60,${tip} ${60 + wide},${base} 60,60`} fill="#ffffff" fillOpacity={dim} />
      <polygon points={`60,${tip} ${60 - wide},${base} 60,60 ${60 + wide},${base}`} fill="none" stroke="#ffffff" strokeOpacity={0.13} strokeWidth={0.8} strokeLinejoin="round" />
    </g>
  );
}

export default function AxisCompass() {
  const layer = useMapStore((s) => s.layer);
  const ax = LAYER_AXES[layer];
  const t = (s: string) => s || "미세한 차이";

  const cl = "absolute text-[10.5px] leading-[1.25] text-ink-2 drop-shadow-[0_1px_3px_rgba(2,4,10,.95)]";
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>

      <svg viewBox="0 0 120 120" className="absolute top-1/2 left-1/2 h-[124px] w-[124px] -translate-x-1/2 -translate-y-1/2">

        {[45, 135, 225, 315].map((r) => (
          <Point key={r} len={27} wide={4} rotate={r} bright={0.07} dim={0.025} />
        ))}
        {[0, 90, 180, 270].map((r) => (
          <Point key={r} len={52} wide={5.5} rotate={r} bright={0.14} dim={0.045} />
        ))}
        <circle cx="60" cy="60" r="1.6" fill="#ffffff" fillOpacity={0.25} />
      </svg>
      <span className={`${cl} top-1.5 left-1/2 max-w-[70%] -translate-x-1/2 text-center`}>{t(ax.y[1])}</span>
      <span className={`${cl} bottom-1.5 left-1/2 max-w-[70%] -translate-x-1/2 text-center`}>{t(ax.y[0])}</span>
      <span className={`${cl} top-1/2 left-2 max-w-[32%] -translate-y-1/2 text-left`}>{t(ax.x[0])}</span>
      <span className={`${cl} top-1/2 right-2 max-w-[32%] -translate-y-1/2 text-right`}>{t(ax.x[1])}</span>
    </div>
  );
}

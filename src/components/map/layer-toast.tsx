"use client";

import { useMapStore } from "@/stores/use-map-store";

export default function LayerToast() {
  const morph = useMapStore((s) => s.morph);
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center transition-opacity duration-[250ms] ${morph ? "opacity-100" : "opacity-0"}`}
    >
      <div className="grad-text font-display text-[clamp(20px,3vw,30px)] font-semibold text-balance [text-shadow:0_2px_24px_#000]">{morph?.big}</div>
    </div>
  );
}

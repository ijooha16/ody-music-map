"use client";

import { useEffect, useRef, useState } from "react";
import { LAYER_NAMES, LAYER_NAMES_EN, LAYER_SUMMARIES, LAYER_TITLE } from "@/constants";
import { useMapStore } from "@/stores/use-map-store";

export default function LayerTitleCard() {
  const layer = useMapStore((s) => s.layer);
  const morph = useMapStore((s) => s.morph);
  const [shown, setShown] = useState<{ layer: number; seq: number } | null>(null);
  const prev = useRef(layer);

  useEffect(() => {
    if (prev.current === layer) return;
    prev.current = layer;
    setShown((s) => ({ layer, seq: (s?.seq ?? 0) + 1 }));
    const id = window.setTimeout(() => setShown(null), LAYER_TITLE.showMs);
    return () => window.clearTimeout(id);
  }, [layer]);

  if (!shown || morph) return null;
  return (
    <div key={shown.seq} className="animate-layer-title pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-1.5 text-center">
      <span className="lbl tracking-[0.32em] text-ink-3">{LAYER_NAMES_EN[shown.layer]}</span>
      <span className="grad-text font-display text-[clamp(30px,5vw,52px)] leading-tight font-semibold [text-shadow:0_2px_28px_#000]">{LAYER_NAMES[shown.layer]}</span>
      <span className="max-w-[min(420px,86vw)] text-sm text-balance text-ink-2 [text-shadow:0_1px_12px_#000]">{LAYER_SUMMARIES[shown.layer]}</span>
    </div>
  );
}

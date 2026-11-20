"use client";

import { LAYER_SUMMARIES } from "@/constants";
import { useMapStore } from "@/stores/use-map-store";

export default function LayerSummary() {
  const layer = useMapStore((s) => s.layer);

  return (
    <p

      className="max-w-[min(34vw,420px)] pl-2 text-[14.5px] leading-[1.4] text-ink-3 max-tablet:max-w-[calc(100dvw-2*var(--spacing-gutter-sm))] max-tablet:pl-0 max-tablet:truncate max-tablet:text-[12.5px] max-tablet:tracking-[-0.01em]">
      {LAYER_SUMMARIES[layer]}
    </p>
  );
}

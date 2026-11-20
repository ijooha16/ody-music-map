"use client";

import { LAYER_COUNT, LAYER_NAMES } from "@/constants";
import { useMapStore } from "@/stores/use-map-store";

export default function LayerGauge() {
  const layer = useMapStore((s) => s.layer);
  return (
    <div className="flex h-[26px] items-end gap-0.5" aria-label="레이어 깊이">
      {Array.from({ length: LAYER_COUNT }, (_, i) => (
        <span
          key={i}
          title={`L${i} ${LAYER_NAMES[i]}`}
          className="relative min-w-0.5 flex-1 rounded-[2px] bg-white/[.07] transition-all duration-normal"
          style={{ height: `${26 + i * (74 / (LAYER_COUNT - 1))}%` }}
        >
          <span
            className={`grad-bg-h absolute inset-0 -bottom-px rounded-[2px] transition-opacity duration-normal ${
              i <= layer ? "opacity-100" : "opacity-0"
            } ${i === layer ? "shadow-[0_0_16px_-3px_rgba(92,157,255,.9)]" : ""}`}
            style={{ backgroundSize: `${LAYER_COUNT * 100}% 100%`, backgroundPositionX: `${(i / (LAYER_COUNT - 1)) * 100}%` }}
          />
        </span>
      ))}
    </div>
  );
}

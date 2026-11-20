"use client";

import { LAYER_COUNT, LAYER_NAMES, LAYER_NAMES_EN } from "@/constants";
import { useMapStore } from "@/stores/use-map-store";
import DrillHint from "./drill-hint";

export default function LayerName() {
  const layer = useMapStore((s) => s.layer);
  const residentCount = useMapStore((s) => s.residentCount);
  const viewportCount = useMapStore((s) => s.viewportCount);
  const zoomK = useMapStore((s) => s.zoomK);
  const gateOpen = useMapStore((s) => s.gateOpen);
  return (
    <div>
      <div className="flex items-baseline gap-2 font-display text-[16.5px] font-semibold tracking-[0.01em]">
        {LAYER_NAMES[layer]}
        <em className="num text-[12.5px] tracking-[0.08em] text-teal not-italic">
          L{layer} / {LAYER_COUNT - 1}
        </em>
      </div>
      <div className="lbl mt-0.5">
        {LAYER_NAMES_EN[layer]} · PC{layer * 2 + 1} × PC{layer * 2 + 2}
      </div>
      <div className="num mt-[3px] flex flex-wrap gap-x-3 text-[12px] tracking-[0.04em] text-ink-3">
        <span>이 겹 {residentCount.toLocaleString()}곡</span>

        <span>배율 ×{zoomK.toFixed(1)}</span>
        <span className={gateOpen ? "text-teal" : ""}>화면 안 {viewportCount.toLocaleString()}곡</span>
      </div>
      <DrillHint />
    </div>
  );
}

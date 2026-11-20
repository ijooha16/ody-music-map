"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "@/components/common/icons";
import { LAYER_COUNT, LAYER_NAMES } from "@/constants";
import { ro } from "@/lib/korean";
import { useFollowStore } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";

export default function LayerStepper() {
  const layer = useMapStore((s) => s.layer);
  const gateOpen = useMapStore((s) => s.gateOpen);
  const canRise = useMapStore((s) => s.canRise);
  const morph = useMapStore((s) => s.morph);
  const drillDown = useMapStore((s) => s.drillDown);
  const surfaceTo = useMapStore((s) => s.surfaceTo);
  const overlayOpen = useMapStore((s) => s.viewMode !== "default");
  const isFollowing = useFollowStore((s) => s.leaderEmail != null);

  const [hover, setHover] = useState<number | null>(null);

  const locked = isFollowing || morph || overlayOpen;

  const nextOpen = !locked && gateOpen && layer + 1 < LAYER_COUNT;
  const last = nextOpen ? layer + 1 : layer;

  const size = (i: number) => (i < layer ? "text-sm" : "text-lg");

  const trailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = trailRef.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [layer, last]);

  const tone = (i: number) => {
    if (i === layer + 1) return "text-teal/70";
    if (hover != null) return i <= hover ? "text-ink" : "text-ink-4/70";
    return i === layer ? "font-semibold text-ink" : "text-ink-3";
  };

  return (
    <div
      ref={trailRef}
      className="rail pointer-events-auto flex w-fit max-w-[min(34vw,420px)] items-center max-tablet:-ml-2 max-tablet:max-w-[calc(100dvw-2*var(--spacing-gutter-sm)+8px)] max-tablet:overflow-x-auto"
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: last + 1 }, (_, i) => {
        const on = i === layer;
        const next = i === layer + 1;

        const enabled = !locked && (next ? gateOpen : i < layer && canRise);
        return (
          <div key={i} className="flex shrink-0 items-center">
            {i > 0 && <ChevronRightIcon size={17} className="shrink-0 text-ink-4/60" />}
            <button
              type="button"
              disabled={!enabled}
              onClick={() => (next ? drillDown() : surfaceTo(i))}
              onMouseEnter={() => enabled && !next && setHover(i)}
              title={
                on
                  ? `지금 단계 · ${LAYER_NAMES[i]}`
                  : overlayOpen
                    ? "뷰를 닫으면 다시 이동할 수 있어요"
                    : next
                      ? "한 칸 깊이 — 이 겹의 별을 그대로 데려가 새 축으로 재투영"
                      : `${LAYER_NAMES[i]}${ro(LAYER_NAMES[i])} 떠오르기 — 두고 온 별이 돌아오고 좌표도 복원`
              }
              className={`px-2 py-1 leading-none whitespace-nowrap transition-colors duration-fast disabled:cursor-default ${size(i)} ${tone(i)}`}
            >
              {LAYER_NAMES[i]}
            </button>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { DEMO } from "@/constants/demo";
import type { CSSProperties } from "react";
import type { Occlusion } from "@/components/map/engine/map-engine";
import { LAYER_AXES } from "@/constants";
import { useMapStore } from "@/stores/use-map-store";

const WING =
  "M4,7.5 C42,12 80,24 95,35.5 Q100,39.5 105,35.5 C120,24 158,12 196,7.5 C198.5,7 198.5,5.3 196,5 C158,8 124,14 105,25 Q100,28 95,25 C76,14 42,8 4,5 C1.5,5.3 1.5,7 4,7.5 Z";
const DIAMOND = "M98.5,3.7 Q100,2 101.5,3.7 L106.6,9.4 Q108,11 106.6,12.6 L101.5,18.3 Q100,20 98.5,18.3 L93.4,12.6 Q92,11 93.4,9.4 Z";
const BASE_W = 200;
const BASE_H = 40;

const SCALE = 0.75;
const W = BASE_W * SCALE;
const H = BASE_H * SCALE;

const EDGE_GAP = 10;

const EDGE_TOP = 76;
const EDGE_BOTTOM = 24;

const scalePath = (d: string) => d.replace(/-?\d+(\.\d+)?/g, (n) => String(+(Number(n) * SCALE).toFixed(2)));
const CLIP = `path('${scalePath(WING)} ${scalePath(DIAMOND)}')`;

const GLASS = { filter: "blur(8px) saturate(1.15) brightness(1.35)", tint: "rgb(255 255 255 / 0.1)", rim: 0.2 } as const;

const DEMO_GLASS = { filter: "blur(10px) saturate(1.15) brightness(1.8)", tint: "rgb(255 255 255 / 0.24)", rim: 0.45 } as const;
const G = DEMO ? DEMO_GLASS : GLASS;

type Dir = "up" | "down" | "left" | "right";

const ROTATE: Record<Dir, number> = { down: 0, up: 180, left: 90, right: -90 };

function GlassArrow({ dir }: { dir: Dir }) {
  const vertical = dir === "left" || dir === "right";
  const glass: CSSProperties = {
    width: W,
    height: H,
    clipPath: CLIP,
    background: G.tint,
    WebkitBackdropFilter: G.filter,
    backdropFilter: G.filter,
  };
  return (
    <span className="relative block shrink-0" style={{ width: vertical ? H : W, height: vertical ? W : H }}>
      <span className="absolute top-1/2 left-1/2" style={{ width: W, height: H, transform: `translate(-50%, -50%) rotate(${ROTATE[dir]}deg)` }}>
        <span className="absolute inset-0" style={glass} />

        <svg className="absolute inset-0 overflow-visible" width={W} height={H} viewBox={`0 0 ${BASE_W} ${BASE_H}`} aria-hidden>
          <path
            d={`${WING} ${DIAMOND}`}
            fill="none"
            stroke="white"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeOpacity={G.rim}
          />
        </svg>
      </span>
    </span>
  );
}

export default function MapAxisLabels({ occlusion }: { occlusion: Occlusion }) {
  const layer = useMapStore((s) => s.layer);

  const veiled = useMapStore((s) => s.viewMode !== "default");

  const ax = LAYER_AXES[layer];

  const x = ax.x[0] ? ax.x : (["미세한 차이", "미세한 차이"] as const);
  const y = ax.y[0] ? ax.y : (["미세한 차이", "미세한 차이"] as const);

  const { right, left } = occlusion;

  const midX = `calc((100% + ${left - right}px) / 2)`;

  const wrap = `pointer-events-none absolute z-[19] flex items-center transition-opacity duration-500 ${veiled ? "opacity-[0.14]" : ""}`;

  const text = `max-w-[24vw] truncate text-[19px] font-semibold tracking-[0.02em] ${DEMO ? "text-ink" : "text-ink-2"} [text-shadow:0_1px_10px_rgb(0_0_0/0.85)]`;
  return (
    <>
      <div className={`${wrap} -translate-y-1/2 gap-2`} style={{ left: left + EDGE_GAP, top: "50%" }}>
        <GlassArrow dir="left" />
        <span className={text}>{x[0]}</span>
      </div>

      <div className={`${wrap} -translate-y-1/2 gap-2`} style={{ right: right + EDGE_GAP, top: "50%" }}>
        <span className={`${text} text-right`}>{x[1]}</span>
        <GlassArrow dir="right" />
      </div>

      <div className={`${wrap} -translate-x-1/2 flex-col gap-1.5`} style={{ top: EDGE_TOP, left: midX }}>
        <GlassArrow dir="up" />
        <span className={`${text} text-center`}>{y[1]}</span>
      </div>
      <div className={`${wrap} -translate-x-1/2 flex-col-reverse gap-1.5`} style={{ bottom: EDGE_BOTTOM, left: midX }}>
        <GlassArrow dir="down" />
        <span className={`${text} text-center`}>{y[0]}</span>
      </div>
    </>
  );
}

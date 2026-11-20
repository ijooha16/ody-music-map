"use client";

import { useMemo } from "react";

const BARS = 64;

const LIVE_SPAN = 3;

export const MIN_H = 0.08;
export const MAX_H = 0.65;

const CONTRAST = 1.6;

const IDLE_SCALE = 0.35;

export function shapeFor(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  const out: number[] = [];
  for (let i = 0; i < BARS; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const noise = s / 2 ** 32;

    const envelope = 0.55 + 0.45 * Math.sin((i / BARS) * Math.PI * 2.3 + (seed % 7));

    const level = Math.pow(Math.min(1, noise * 0.6 + envelope * 0.5), CONTRAST);
    out.push(Math.round(100 * (MIN_H + (MAX_H - MIN_H) * level)));
  }
  return out;
}

export function barHeight(h: number, i: number, head: number, playing: boolean) {
  const passed = i < head;
  const near = playing && Math.abs(i - head) <= LIVE_SPAN;
  return passed || near ? h : Math.round(h * IDLE_SCALE);
}

interface WaveformBarsProps {
  musicId: number | null;

  ratio: number;

  playing: boolean;

  live: boolean;
}

export default function WaveformBars({ musicId, ratio, playing, live }: WaveformBarsProps) {
  const shape = useMemo(() => shapeFor(musicId ?? 0), [musicId]);
  const head = Math.round(ratio * BARS);

  return (
    <div aria-hidden className={`flex h-full items-center justify-between ${live ? "" : "opacity-45"}`}>
      {shape.map((h, i) => {
        const passed = i < head;
        const near = playing && Math.abs(i - head) <= LIVE_SPAN;
        const shown = barHeight(h, i, head, playing);
        return (
          <i
            key={i}
            className={`block w-[2px] shrink-0 rounded-pill transition-[height] duration-300 ${passed ? "bg-teal" : "bg-white/[.16]"} ${near ? "animate-wave" : ""}`}
            style={{ height: `${shown}%`, animationDelay: near ? `${(i % 4) * 110}ms` : undefined }}
          />
        );
      })}
    </div>
  );
}

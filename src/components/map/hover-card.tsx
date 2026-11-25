"use client";

import { useEffect, useRef } from "react";
import { HOVER_CARD } from "@/constants";
import type { MapPoint } from "@/types";
import type { MapEngine } from "./engine/map-engine";
import { coverFor } from "./render/sprites";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface HoverCardProps {
  engine: MapEngine;

  song: MapPoint | null;

  on: boolean;

  onDetail?: () => void;
}

export default function HoverCard({ engine, song, on, onDetail }: HoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLSpanElement>(null);
  const musicId = song?.musicId ?? null;

  const narrow = onDetail != null;
  const w = narrow ? HOVER_CARD.wNarrow : HOVER_CARD.w;
  const h = narrow ? HOVER_CARD.hNarrow : HOVER_CARD.h;

  useEffect(() => {
    const el = coverRef.current;
    if (!el || !song) return;
    let timer = 0;
    let tries = 0;
    const paint = () => {
      el.style.backgroundImage = `url(${coverFor(song).toDataURL()})`;
    };
    const poll = () => {
      timer = 0;
      if ((!song.albumCoverUrl && !song.albumMbid) || tries++ > 30) return;
      paint();
      timer = window.setTimeout(poll, 150);
    };
    paint();
    timer = window.setTimeout(poll, 150);
    return () => clearTimeout(timer);
  }, [song]);

  useEffect(() => {
    if (musicId == null) return;
    const { gap, margin } = HOVER_CARD;
    let raf = 0;
    const follow = () => {
      raf = requestAnimationFrame(follow);
      const el = cardRef.current;
      if (!el) return;

      el.style.opacity = on ? "0.94" : "0";
      const a = engine.hoverAnchor();

      if (!a) {
        el.style.visibility = "hidden";
        return;
      }
      const f = engine.freeRect();
      const x = clamp(a.px - w / 2, f.x0 + margin, Math.max(f.x0 + margin, Math.min(engine.W, f.x1) - w - margin));
      const top = Math.max(margin, f.y0 + margin);
      const bottom = Math.max(top, Math.min(engine.H, f.y1) - h - margin);

      const y = clamp(a.py - h - gap < top ? a.py + gap : a.py - h - gap, top, bottom);
      el.style.visibility = "visible";
      el.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [engine, musicId, on, w, h]);

  if (!song) return null;

  return (
    <div
      ref={cardRef}

      onPointerDown={onDetail ? (e) => e.stopPropagation() : undefined}
      onClick={onDetail}
      role={narrow ? "button" : undefined}
      aria-label={narrow && song ? `${song.title} 상세 열기` : undefined}
      style={{
        width: w,
        height: h,
        visibility: "hidden",
        opacity: 0,
        transition: `opacity ${HOVER_CARD.fadeMs}ms ease-out`,
      }}

      className={`glass-liquid absolute top-0 left-0 z-[25] flex items-center gap-3 px-2.5 will-change-transform max-tablet:z-[19] ${
        narrow ? "pointer-events-auto cursor-pointer" : "pointer-events-none"
      }`}
    >

      <span
        ref={coverRef}
        className="h-[54px] w-[54px] shrink-0 rounded-box-xs border border-line bg-cover bg-center max-tablet:h-10 max-tablet:w-10"
      />
      <span className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-semibold text-ink">{song.title}</p>
        <p className="truncate text-[13px] text-ink-2">
          {song.artist ?? "-"}

          {!song.playable && <span className="text-warn"> · 재생 불가</span>}
        </p>

        {!narrow && (
          <p className={`num truncate text-2xs ${song.playable ? "text-ink-3" : "text-warn"}`}>
            ▶ {song.weight.toLocaleString()}
            {song.playable ? "" : " · 재생 불가"}
          </p>
        )}
      </span>

      {onDetail && (
        <span
          aria-hidden
          className="shrink-0 rounded-pill border border-teal/40 bg-teal/15 px-2 py-1 text-[13.5px] font-semibold whitespace-nowrap text-teal"
        >
          상세 ›
        </span>
      )}
    </div>
  );
}

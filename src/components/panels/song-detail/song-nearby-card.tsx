"use client";

import { useEffect, useRef } from "react";
import MarqueeText from "@/components/common/marquee-text";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { coverFor } from "@/components/map/render/sprites";
import { NO_GENRE_ID } from "@/constants";

interface SongNearbyCardProps {
  musicId: number;
  title: string;
  artist: string | null;

  rank: number;

  playing: boolean;
  onClick: () => void;
}

export default function SongNearbyCard({ musicId, title, artist, rank, playing, onClick }: SongNearbyCardProps) {
  const coverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = coverRef.current;
    if (!el) return;
    const albumMbid = getMapEngine()?.pointOf(musicId)?.albumMbid ?? null;
    const point = { musicId, genreId: NO_GENRE_ID, pc: [], weight: 1, title: "", artist: null, youtubeUrl: null, albumMbid, playable: true };
    let timer = 0;
    let tries = 0;
    const paint = () => {
      el.style.backgroundImage = `url(${coverFor(point).toDataURL()})`;
    };

    const poll = () => {
      timer = 0;
      if (!albumMbid || tries++ > 30) return;
      paint();
      timer = window.setTimeout(poll, 150);
    };
    paint();
    timer = window.setTimeout(poll, 150);
    return () => clearTimeout(timer);
  }, [musicId]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${title}${artist ? ` · ${artist}` : ""}`}
      className={`group relative aspect-square w-[112px] shrink-0 snap-start overflow-hidden rounded-box-sm border text-left transition-colors duration-fast ${
        playing ? "border-teal/70" : "border-line hover:border-line-2"
      }`}
    >
      <div ref={coverRef} aria-hidden className="absolute inset-0 bg-cover bg-center transition-transform duration-normal ease-spring group-hover:scale-[1.06]" />

      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void via-void/70 via-38% to-transparent to-72%" />
      <span className="num absolute top-1 left-2 text-[12.5px] text-ink-2 drop-shadow-[0_1px_4px_rgba(4,6,13,.9)]">#{rank}</span>
      {playing && <span className="absolute top-1 right-2 text-[12px] text-teal drop-shadow-[0_1px_4px_rgba(4,6,13,.9)]">▶</span>}
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-px px-2 pb-2">

        <MarqueeText text={title} className="text-[15.5px] leading-tight font-medium text-ink drop-shadow-[0_1px_5px_rgba(4,6,13,.95)]" />
        <MarqueeText text={artist ?? "Unknown"} className="text-[14px] leading-tight text-ink-3 drop-shadow-[0_1px_5px_rgba(4,6,13,.95)]" />
      </span>
    </button>
  );
}

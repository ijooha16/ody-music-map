"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useAlbumCover } from "@/hooks/use-album-cover";

const FADE = 72;

const BACKDROP_PX = 512;

interface SongCoverBackdropProps {
  musicId: number;

  scrollerRef: RefObject<HTMLDivElement | null>;

  reveal: number;
}

export default function SongCoverBackdrop({ musicId, scrollerRef, reveal }: SongCoverBackdropProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);

  useAlbumCover(coverRef, musicId, BACKDROP_PX);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const plate = plateRef.current;
    if (!scroller || !plate) return;

    let raf = 0;
    const paint = () => {
      raf = 0;
      const left = reveal - scroller.scrollTop;
      plate.style.opacity = String(Math.min(1, Math.max(0, 1 - left / FADE)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    paint();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [scrollerRef, reveal, musicId]);

  return (
    <div
      aria-hidden

      data-cover-backdrop
      className="pointer-events-none absolute inset-x-0 top-0 aspect-square [-webkit-mask-image:linear-gradient(to_bottom,#000_62%,transparent)] [mask-image:linear-gradient(to_bottom,#000_62%,transparent)]"
    >

      <div ref={coverRef} className="absolute inset-0 scale-[1.02] bg-cover bg-center" />

      <div className="grad-bg absolute inset-0 opacity-40 mix-blend-soft-light" />

      <div className="absolute inset-x-0 top-0 h-[72px] bg-gradient-to-b from-void/80 via-void/40 via-55% to-transparent" />

      <div ref={plateRef} className="absolute inset-0 bg-void-3 opacity-0 max-tablet:bg-void-3/55" />
    </div>
  );
}

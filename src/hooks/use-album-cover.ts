"use client";

import { useEffect, useRef, type RefObject } from "react";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { coverFor } from "@/components/map/render/sprites";
import { NO_GENRE_ID } from "@/constants";
import { useMusicDetailQuery } from "@/hooks/queries/use-music-detail-query";

export function useAlbumCover(ref: RefObject<HTMLElement | null>, musicId: number | null, size: number, onPaint?: (canvas: HTMLCanvasElement) => void): void {
  const onPaintRef = useRef(onPaint);
  useEffect(() => {
    onPaintRef.current = onPaint;
  });
  const fromMap = musicId != null ? (getMapEngine()?.pointOf(musicId)?.albumMbid ?? null) : null;
  const fromDetail = useMusicDetailQuery(musicId).data?.albumMbid ?? null;
  const albumMbid = fromMap ?? fromDetail;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (musicId == null) {
      el.style.backgroundImage = "";
      return;
    }
    let timer = 0;
    const paint = () => {
      const canvas = coverFor({ musicId, genreId: NO_GENRE_ID, pc: [], weight: 1, title: "", artist: null, youtubeUrl: null, albumMbid, playable: true }, size);
      el.style.backgroundImage = `url(${canvas.toDataURL()})`;
      onPaintRef.current?.(canvas);
    };
    paint();

    let tries = 0;
    const poll = () => {
      timer = 0;
      if (!albumMbid || tries++ > 40) return;
      paint();
      timer = window.setTimeout(poll, 150);
    };
    timer = window.setTimeout(poll, 150);
    return () => clearTimeout(timer);
  }, [ref, musicId, albumMbid, size]);
}

"use client";

import { useEffect, useRef, type RefObject } from "react";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { coverFor } from "@/components/map/render/sprites";
import { NO_GENRE_ID } from "@/constants";
import { useMusicDetailQuery } from "@/hooks/queries/use-music-detail-query";

export function useAlbumCover(ref: RefObject<HTMLElement | null>, musicId: number | null, size: number, onPaint?: (canvas: HTMLCanvasElement) => void, genreId = NO_GENRE_ID): void {
  const onPaintRef = useRef(onPaint);
  useEffect(() => {
    onPaintRef.current = onPaint;
  });
  const point = musicId != null ? getMapEngine()?.pointOf(musicId) : null;
  const detail = useMusicDetailQuery(musicId).data;
  const albumMbid = point?.albumMbid ?? detail?.albumMbid;
  const albumCoverUrl = point?.albumCoverUrl ?? detail?.albumCoverUrl;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (musicId == null) {
      el.style.backgroundImage = "";
      return;
    }
    let timer = 0;
    let painted: HTMLCanvasElement | null = null;
    const paint = () => {
      const canvas = coverFor({ musicId, genreId, pc: [], weight: 1, title: "", artist: null, youtubeUrl: null, albumMbid, albumCoverUrl, playable: true }, size);
      if (canvas === painted) return;
      painted = canvas;
      el.style.backgroundImage = `url(${canvas.toDataURL()})`;
      onPaintRef.current?.(canvas);
    };
    paint();

    let tries = 0;
    const poll = () => {
      timer = 0;
      if ((!albumCoverUrl && !albumMbid) || tries++ > 40) return;
      paint();
      timer = window.setTimeout(poll, 150);
    };
    timer = window.setTimeout(poll, 150);
    return () => clearTimeout(timer);
  }, [ref, musicId, albumMbid, albumCoverUrl, size, genreId]);
}

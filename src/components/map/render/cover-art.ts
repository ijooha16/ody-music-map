"use client";

import { BudgetCache, canvasBytes } from "@/lib/budget-cache";

const RELEASE = (mbid: string) => `https://coverartarchive.org/release/${mbid}/front-500`;

const keyOf = (musicId: number, size: number) => `${musicId}:${size}`;

const ready = new BudgetCache<string, HTMLCanvasElement>(12 * 1024 * 1024, canvasBytes);

const source = new BudgetCache<number, HTMLImageElement>(8, () => 1);
const failed = new Set<number>();
const loading = new Set<string>();

function bake(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;

  const side = Math.min(img.naturalWidth, img.naturalHeight);
  g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
  return c;
}

export function albumCover(musicId: number, albumMbid: string | null | undefined, size: number): HTMLCanvasElement | null {
  if (!albumMbid) return null;
  const key = keyOf(musicId, size);
  const hit = ready.get(key);
  if (hit) return hit;
  if (failed.has(musicId)) return null;

  const had = source.get(musicId);
  if (had) {
    const baked = bake(had, size);
    ready.set(key, baked);
    return baked;
  }
  if (loading.has(key)) return null;

  loading.add(key);
  const load = (url: string, onFail: () => void) => {
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.onload = () => {
      loading.delete(key);
      source.set(musicId, img);
      ready.set(key, bake(img, size));
    };
    img.onerror = onFail;
    img.src = url;
  };
  load(RELEASE(albumMbid), () => {
    loading.delete(key);
    failed.add(musicId);
  });
  return null;
}

export function hasAlbumCover(musicId: number, size: number): boolean {
  return ready.has(keyOf(musicId, size));
}

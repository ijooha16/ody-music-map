"use client";

import { BudgetCache, canvasBytes } from "@/lib/budget-cache";
import type { MapPoint } from "@/types";

const ready = new BudgetCache<string, HTMLCanvasElement>(12 * 1024 * 1024, canvasBytes);
const source = new BudgetCache<string, HTMLImageElement>(32, () => 1);
const failed = new BudgetCache<string, true>(2048, () => 1);
const loading = new Set<string>();

function bake(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  context.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
  return canvas;
}

export function albumCover({ albumCoverUrl, albumMbid }: Pick<MapPoint, "albumCoverUrl" | "albumMbid">, size: number): HTMLCanvasElement | null {
  const archiveUrl = albumMbid ? `https://coverartarchive.org/release/${albumMbid}/front-500` : null;
  const url = albumCoverUrl && !failed.has(albumCoverUrl) ? albumCoverUrl : archiveUrl;
  if (!url || failed.has(url)) return null;

  const key = `${size}:${url}`;
  const cached = ready.get(key);
  if (cached) return cached;

  const image = source.get(url);
  if (image) return ready.set(key, bake(image, size));
  if (loading.has(url)) return null;

  loading.add(url);
  const pending = new Image();
  pending.crossOrigin = "anonymous";
  pending.onload = () => {
    loading.delete(url);
    source.set(url, pending);
    ready.set(key, bake(pending, size));
  };
  pending.onerror = () => {
    loading.delete(url);
    failed.set(url, true);
  };
  pending.src = url;
  return null;
}

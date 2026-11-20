"use client";

const ready = new Map<string, HTMLImageElement>();
const failed = new Set<string>();
const loading = new Set<string>();
const waiters = new Set<() => void>();

export function onPhotoLoaded(cb: () => void): () => void {
  waiters.add(cb);
  return () => {
    waiters.delete(cb);
  };
}

export function photoFor(url: string | null | undefined): HTMLImageElement | null {
  if (!url) return null;
  const hit = ready.get(url);
  if (hit) return hit;
  if (failed.has(url) || loading.has(url)) return null;

  loading.add(url);
  load(url, "cors");
  return null;
}

function load(url: string, mode: "cors" | "cors-fresh" | "plain") {
  const img = new Image();
  if (mode !== "plain") img.crossOrigin = "anonymous";
  img.onload = () => {
    loading.delete(url);

    if (ready.size > 200) ready.clear();
    ready.set(url, img);
    for (const cb of waiters) cb();
  };
  img.onerror = () => {
    if (mode === "cors") return load(url, "cors-fresh");
    if (mode === "cors-fresh") return load(url, "plain");
    loading.delete(url);
    failed.add(url);
  };
  img.src = mode === "cors-fresh" ? withFreshQuery(url) : url;
}

export function withFreshQuery(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}cors=1`;
}

export function drawCropped(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number): void {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, x, y, size, size);
}

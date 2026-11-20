import { STAR_LOOK } from "@/constants";
import { GENRE_COLORS, genreIdx } from "@/constants/design-tokens";
import type { MapPoint } from "@/types";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function hash01(n: number): number {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;

  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

export function magOf(weight: number) {
  return clamp((Math.log10(Math.max(1, weight)) - 2.6) / 4.2, 0, 1);
}

export function starMag(s: MapPoint): number {
  return STAR_LOOK.randomSize ? hash01(s.musicId) : magOf(s.weight);
}

export function starColorIdx(s: MapPoint): number {
  return STAR_LOOK.randomColor ? Math.floor(hash01(s.musicId * 31 + 7) * GENRE_COLORS.length) : genreIdx(s.genreId);
}

export function starRgb(s: MapPoint): readonly [number, number, number] {
  return GENRE_COLORS[starColorIdx(s)];
}

import type { Id } from "./common";

export type Location16 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

export interface Location {
  pc1: number; pc2: number; pc3: number; pc4: number;
  pc5: number; pc6: number; pc7: number; pc8: number;
  pc9: number; pc10: number; pc11: number; pc12: number;
  pc13: number; pc14: number; pc15: number; pc16: number;
}

export function toLocation16(l: Location): Location16 {
  return Array.from({ length: 16 }, (_, i) => l[`pc${i + 1}` as keyof Location]) as Location16;
}

export interface Music {
  id: Id;

  mbid: string;

  albumMbid?: string | null;

  title: string;

  artist: string | null;

  releaseYear: number | null;

  bpm: number | null;

  duration: number | null;

  album: string | null;

  youtubeUrl: string | null;

  location: Location16 | null;

  playCnt: number;

  youtubeCnt: number;
}

export type PlayableMusic = Music & { youtubeUrl: string };

export type VideoIdLookup =

  | "found"

  | "notFound"

  | "unsearched";

import type { Id } from "./common";

export const PC_DIMS = 16;

export interface MapPoint {
  musicId: Id;

  pc: number[];

  genreId: Id;

  weight: number;
  title: string;
  artist: string | null;

  youtubeUrl: string | null;

  albumMbid?: string | null;

  playable: boolean;

  ghostOnly?: boolean;
}

export interface NearbyResponse {
  center: MapPoint;
  neighbors: MapPoint[];
}

export interface MapCamera {
  cx: number;
  cy: number;
  s: number;
}

export interface LayerBox {
  layer: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

import type { Id } from "./common";

export interface ConstellationPoint {
  musicId: Id;

  x: number;
  y: number;
}

export interface ConstellationLayout {
  points: ConstellationPoint[];
}

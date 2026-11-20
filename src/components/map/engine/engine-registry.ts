import type { MapEngine } from "./map-engine";

let engine: MapEngine | null = null;

export function registerMapEngine(e: MapEngine | null) {
  engine = e;
}

export function getMapEngine(): MapEngine | null {
  return engine;
}

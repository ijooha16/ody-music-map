import { getMapEngine } from "@/components/map/engine/engine-registry";
import type { Point } from "@/lib/nearby-from-layer";

export function layerPointOf(musicId: number | null, layer: number): Point | null {
  const song = musicId != null ? getMapEngine()?.pointOf(musicId) : null;
  return song ? { x: song.pc[layer * 2], y: song.pc[layer * 2 + 1] } : null;
}

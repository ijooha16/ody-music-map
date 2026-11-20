import type { QueryClient } from "@tanstack/react-query";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { musicDetailQueryOptions } from "@/hooks/queries/use-music-detail-query";
import { musicToMapPoint } from "@/lib/map-point";

export async function ensureSongPoint(qc: QueryClient, musicId: number): Promise<boolean> {
  if (getMapEngine()?.pointOf(musicId)) return true;
  try {
    const point = musicToMapPoint(await qc.fetchQuery(musicDetailQueryOptions(musicId)));
    if (!point) return false;
    const engine = getMapEngine();
    if (!engine) return false;
    engine.adopt([point]);
    return true;
  } catch {
    return false;
  }
}

import { fail, failLive, ok, okLive } from "@/lib/api-response";
import {
  backendGet,
  BackendError,
  isBackendEnabled,
  toMapPoint,
  type BackendMusicDetailResponse,
} from "@/lib/backend";
import { mockNearby } from "@/mocks/music";
import type { NearbyResponse } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ musicId: string }> }) {
  const { musicId } = await params;
  const id = Number(musicId);
  if (!id) return fail("VALIDATION_ERROR", "musicId 가 올바르지 않습니다.", 400);

  if (!isBackendEnabled()) return ok(mockNearby(id));

  const upstream = `/api/music/detail?id=${id}`;
  try {
    const res = await backendGet<BackendMusicDetailResponse>(upstream);
    const nearby: NearbyResponse = {
      center: toMapPoint(res),
      neighbors: res.neighbors.map(toMapPoint),
    };
    return okLive(nearby, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("MUSIC_NOT_FOUND", err.message, err.status || 502, upstream);
  }
}

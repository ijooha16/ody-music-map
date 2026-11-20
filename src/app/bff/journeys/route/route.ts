import { fail, failLive, ok, okLive } from "@/lib/api-response";
import { backendGet, BackendError, isBackendEnabled, toPcArray, type BackendJourneyResponse } from "@/lib/backend";
import { mockJourney } from "@/mocks/music";
import type { JourneyRoute } from "@/types";

function toJourneyRoute(res: BackendJourneyResponse, startId: number, endId: number): JourneyRoute {
  return {
    startMusicId: startId,
    endMusicId: endId,
    totalDuration: res.totalDuration,
    stops: res.path.map((stop) => ({
      id: stop.id,
      title: stop.title,
      artist: stop.artist,
      duration: stop.duration,

      order: stop.step,
      pc: toPcArray(stop.location),
    })),
  };
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const start = Number(sp.get("start"));
  const end = Number(sp.get("end"));
  if (!start || !end) return fail("VALIDATION_ERROR", "start' end' 파라미터가 필요합니다.", 400);

  if (!isBackendEnabled()) return ok(mockJourney(start, end));

  const upstream = `/api/music/journey?start=${start}&end=${end}`;
  try {
    const res = await backendGet<BackendJourneyResponse>(upstream);
    return okLive(toJourneyRoute(res, start, end), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("PATH_NOT_FOUND", err.message, err.status || 502, upstream);
  }
}

import { fail, failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError, callerAuth } from "@/lib/backend";

const UPSTREAM = "/api/playlist/music/reorder";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playlistId = Number(id);
  const body = (await req.json().catch(() => ({}))) as { musicIds?: number[] };
  const musicIdList = body.musicIds;
  if (!playlistId || !Array.isArray(musicIdList) || musicIdList.length === 0) {
    return fail("VALIDATION_ERROR", "playlistId 와 musicIds 가 필요합니다.", 400);
  }

  try {
    const res = await backendPost<{ playlistId: number; musicCnt: number }>(
      UPSTREAM,
      { playlistId, musicIdList },
      { headers: callerAuth(req) },
    );
    return okLive(res, UPSTREAM);
  } catch (e) {
    const err = e as BackendError;

    const code = err.status === 401 || err.status === 403 ? "UNAUTHENTICATED" : "PLAYLIST_NOT_FOUND";
    return failLive(code, err.message, err.status || 502, UPSTREAM);
  }
}

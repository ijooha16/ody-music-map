import { fail, failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError, callerAuth } from "@/lib/backend";

const UPSTREAM = "/api/playlist/music/insert";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playlistId = Number(id);
  const body = (await req.json().catch(() => ({}))) as { musicId?: number };
  if (!playlistId || !body.musicId) return fail("VALIDATION_ERROR", "playlistId 와 musicId 가 필요합니다.", 400);

  try {
    const res = await backendPost<{ playlistId: number; insertedCnt: number; skippedCnt: number; musicCnt: number }>(
      UPSTREAM,
      { playlistId, musicIdList: [body.musicId] },
      { headers: callerAuth(req) },
    );
    return okLive(res, UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive("PLAYLIST_NOT_FOUND", err.message, err.status || 502, UPSTREAM);
  }
}

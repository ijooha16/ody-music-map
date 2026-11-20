import { fail, failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError, callerAuth } from "@/lib/backend";

const UPSTREAM = "/api/playlist/music/delete";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; musicId: string }> }) {
  const { id, musicId } = await params;
  const playlistId = Number(id);
  const target = Number(musicId);
  if (!playlistId || !target) return fail("VALIDATION_ERROR", "playlistId 와 musicId 가 필요합니다.", 400);

  try {
    const res = await backendPost<{ playlistId: number; deletedCnt: number; musicCnt: number }>(
      UPSTREAM,
      { playlistId, musicIdList: [target] },
      { headers: callerAuth(req) },
    );
    return okLive(res, UPSTREAM);
  } catch (e) {
    const err = e as BackendError;
    return failLive("PLAYLIST_NOT_FOUND", err.message, err.status || 502, UPSTREAM);
  }
}

import { fail, okLive } from "@/lib/api-response";
import { backendPost, callerAuth } from "@/lib/backend";
import { artworkFail } from "@/lib/contest-bff";

const UPSTREAM = "/api/playlist/create";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { playlistName?: unknown; musicIds?: unknown };
  const playlistName = typeof body.playlistName === "string" ? body.playlistName.trim() : "";
  const musicIds = Array.isArray(body.musicIds) ? body.musicIds.filter((n): n is number => Number.isInteger(n) && n > 0) : [];
  if (!playlistName) return fail("VALIDATION_ERROR", "플레이리스트 이름이 필요합니다.", 400);
  if (musicIds.length === 0) return fail("VALIDATION_ERROR", "가져올 곡이 없습니다.", 400);
  try {
    const res = await backendPost<{ playlistId: number }>(UPSTREAM, { playlistName, musicIdList: musicIds }, { headers: callerAuth(req) });
    return okLive({ playlistId: res.playlistId }, UPSTREAM, 201);
  } catch (e) {
    return artworkFail(e, UPSTREAM);
  }
}

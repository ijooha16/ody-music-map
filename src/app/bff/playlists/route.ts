import { fail, failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError, callerAuth } from "@/lib/backend";
import type { PlaylistDetail } from "@/types";

const UPSTREAM = "/api/playlist/create";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { playlistName?: string };
  const playlistName = body.playlistName?.trim();
  if (!playlistName) return fail("VALIDATION_ERROR", "플레이리스트 이름이 필요합니다.", 400);

  try {
    const res = await backendPost<{ playlistId: number; playlistName: string; musicCnt: number }>(
      UPSTREAM,
      { playlistName, musicIdList: [] },
      { headers: callerAuth(req) },
    );
    const created: PlaylistDetail = {
      id: res.playlistId,
      email: null,
      playlistName: res.playlistName,
      likeCnt: null,
      createdAt: null,
      updatedAt: null,
      ownerNickname: null,
      moodTags: [],
      itemCount: res.musicCnt ?? 0,
      totalDuration: 0,
      isLiked: false,
      items: [],
    };
    return okLive(created, UPSTREAM, 201);
  } catch (e) {
    const err = e as BackendError;

    return failLive(err.code === "PLAYLIST_NAME_DUPLICATED" ? "PLAYLIST_NAME_DUPLICATED" : "INTERNAL_ERROR", err.message, err.status || 502, UPSTREAM);
  }
}

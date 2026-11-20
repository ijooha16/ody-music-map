import { fail, failLive, okLive } from "@/lib/api-response";
import { backendDelete, backendGet, BackendError, callerAuth, toMusic, type BackendPlaylistDetailResponse } from "@/lib/backend";
import type { PlaylistDetail } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

function toPlaylistDetail(res: BackendPlaylistDetailResponse): PlaylistDetail {
  const items = res.musics.map((m) => ({ playlistId: res.playlistId, musicId: m.id, addedAt: null, music: toMusic(m) }));
  return {
    id: res.playlistId,
    email: null,
    playlistName: res.playlistName,
    likeCnt: res.likeCnt,
    createdAt: null,
    updatedAt: null,
    ownerNickname: null,
    moodTags: [],
    itemCount: res.musicCnt ?? items.length,
    totalDuration: res.totalDuration ?? 0,
    isLiked: res.isLiked,
    items,
  };
}

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const playlistId = Number(id);
  if (!playlistId) return fail("VALIDATION_ERROR", "플레이리스트 ID 가 올바르지 않습니다.", 400);

  const upstream = `/api/playlist/detail?playlistId=${playlistId}`;
  try {
    const res = await backendGet<BackendPlaylistDetailResponse>(upstream, { headers: callerAuth(req) });
    return okLive(toPlaylistDetail(res), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("PLAYLIST_NOT_FOUND", err.message, err.status || 502, upstream);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const playlistId = Number(id);
  if (!playlistId) return fail("VALIDATION_ERROR", "플레이리스트 ID 가 올바르지 않습니다.", 400);

  const upstream = `/api/playlist/delete/${playlistId}`;
  try {
    await backendDelete(upstream, { headers: callerAuth(req) });
    return okLive({ ok: true }, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("PLAYLIST_NOT_FOUND", err.message, err.status || 502, upstream);
  }
}

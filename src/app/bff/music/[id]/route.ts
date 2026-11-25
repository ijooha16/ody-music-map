import { fail, failLive, ok, okLive } from "@/lib/api-response";
import {
  backendGet,
  BackendError,
  isBackendEnabled,
  toMusic,
  emailFromToken,
  toPcArray,
  type BackendMusicDetailResponse,
} from "@/lib/backend";
import { isMockLiked } from "@/mocks/backend";
import { mockMusicDetail } from "@/mocks/music";
import type { MusicDetail } from "@/types";

function toMusicDetail(res: BackendMusicDetailResponse): MusicDetail {
  const pc = toPcArray(res.location);
  return {
    ...toMusic(res),

    principalComponents: pc.map((v, i) => ({ axis: i, value: v })),
    nearby: res.neighbors.map((n) => ({ id: n.id, title: n.title, artist: n.artist, albumMbid: n.albumMbid, albumCoverUrl: n.albumCoverUrl })),
    relatedPlaylists: [],
    liked: res.liked ?? false,
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const musicId = Number(id);
  if (!musicId) return fail("VALIDATION_ERROR", "곡 ID 가 올바르지 않습니다.", 400);

  if (!isBackendEnabled()) return ok({ ...mockMusicDetail(musicId), liked: isMockLiked(emailFromToken(req), musicId) });

  const upstream = `/api/music/detail?id=${musicId}`;
  try {
    const res = await backendGet<BackendMusicDetailResponse>(upstream);
    return okLive(toMusicDetail(res), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("MUSIC_NOT_FOUND", err.message, err.status || 502, upstream);
  }
}

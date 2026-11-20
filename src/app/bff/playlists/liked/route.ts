import { failLive, okLive } from "@/lib/api-response";
import { backendGet, BackendError, emailFromToken, type BackendLikedPlaylistSummary } from "@/lib/backend";
import type { PlaylistSummary } from "@/types";

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email") || emailFromToken(req);
  if (!email) return failLive("UNAUTHENTICATED", "인증이 필요합니다.", 401, "/api/playlist/liked");

  const upstream = `/api/playlist/liked?email=${encodeURIComponent(email)}`;
  try {
    const res = await backendGet<{ content: BackendLikedPlaylistSummary[] }>(upstream);
    return okLive(res.content.map(toSummary), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(err.code === "USER_PRIVATE" ? "USER_PRIVATE" : err.status === 404 ? "USER_NOT_FOUND" : "INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}

const toSummary = (p: BackendLikedPlaylistSummary): PlaylistSummary => ({
  id: p.playlistId,
  playlistName: p.playlistName,
  likeCnt: p.likeCnt,
  itemCount: p.musicCnt,
  ownerNickname: p.ownerNickname,
});

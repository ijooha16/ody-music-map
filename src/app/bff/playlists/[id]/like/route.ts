import { failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError, type BackendPlaylistLikeResponse } from "@/lib/backend";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const upstream = "/api/playlist/like";
  try {
    const { liked } = (await req.json()) as { liked: boolean };
    const res = await backendPost<BackendPlaylistLikeResponse>(upstream, { playlistId: Number(id), liked });
    return okLive({ isLiked: res.liked, likeCnt: res.likeCnt }, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(err.status === 404 ? "PLAYLIST_NOT_FOUND" : err.status === 400 ? "INVALID_INPUT" : "INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}

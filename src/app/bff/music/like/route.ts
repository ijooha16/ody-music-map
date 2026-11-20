import { failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError, type BackendMusicLikeResponse } from "@/lib/backend";

export async function POST(req: Request) {
  const upstream = "/api/music/like";
  try {
    const body = (await req.json()) as { musicId: number; liked: boolean };
    const res = await backendPost<BackendMusicLikeResponse>(upstream, body);
    return okLive({ liked: res.liked }, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(err.status === 404 ? "MUSIC_NOT_FOUND" : err.status === 400 ? "INVALID_INPUT" : "INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}

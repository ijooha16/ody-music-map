import { failLive, okLive } from "@/lib/api-response";
import { backendPost, BackendError } from "@/lib/backend";
import type { PlayRequest, PlayResponse } from "@/types";

export async function POST(req: Request) {
  const upstream = "/api/music/play";
  try {
    const body = (await req.json()) as PlayRequest;
    return okLive(await backendPost<PlayResponse>(upstream, body), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(code(err.status), err.message, err.status || 502, upstream);
  }
}

const code = (status: number) => (status === 422 ? "PRESENCE_ERROR" : status === 404 ? "MUSIC_NOT_FOUND" : "INTERNAL_ERROR");

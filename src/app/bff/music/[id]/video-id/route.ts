import { failLive, ok, okLive } from "@/lib/api-response";
import { backendPost, BackendError, isBackendEnabled } from "@/lib/backend";
import { songById } from "@/mocks/songs";
import { mockVideoId } from "@/mocks/video";
import type { VideoIdLookup } from "@/types";

interface BackendVideoIdBatch {
  items?: { musicId: number; videoId: string | null }[];
}

const NOT_FOUND = "none";

export function videoIdLookup(item: { videoId: string | null } | undefined): VideoIdLookup {
  if (item == null) return "notFound";
  const raw = item.videoId;
  if (raw === NOT_FOUND || raw === "") return "notFound";
  return raw ? "found" : "unsearched";
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const musicId = Number(id);

  if (!isBackendEnabled()) {
    const videoId = mockVideoId(musicId, songById(musicId)?.playable ?? true);
    return ok({ musicId, videoId, lookup: videoId ? "found" : "notFound" } satisfies { musicId: number; videoId: string | null; lookup: VideoIdLookup });
  }

  const upstream = "/api/music/videoid";
  try {
    const data = await backendPost<BackendVideoIdBatch>(upstream, { musicIds: [musicId] });

    const item = data.items?.find((v) => v.musicId === musicId);
    const lookup = videoIdLookup(item);
    return okLive({ musicId, videoId: lookup === "found" ? (item?.videoId ?? null) : null, lookup }, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, PLAYBACK_BLOCKED, QUERY_KEYS, type PlaybackBlocked } from "@/constants";
import { useUnplayableStore } from "@/stores/use-unplayable-store";
import type { VideoIdLookup } from "@/types";

interface VideoIdResult {
  musicId: number;

  videoId: string | null;

  lookup: VideoIdLookup;
}

const VIDEO_ID_CACHE_MS = 30 * 60 * 1000;

export function useVideoIdQuery(musicId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.music.videoId(musicId ?? -1),
    queryFn: () => api<VideoIdResult>(API_ENDPOINTS.music.videoId(musicId!)),
    enabled: musicId != null,
    staleTime: VIDEO_ID_CACHE_MS,

    gcTime: VIDEO_ID_CACHE_MS,
  });
}

export function usePlayability(musicId: number | null): { canPlay: boolean; blocked: PlaybackBlocked | null; retry: () => void } {
  const { status, data, refetch } = useVideoIdQuery(musicId);
  const markUnplayable = useUnplayableStore((s) => s.markUnplayable);

  const retry = () => void refetch();

  const noVideo = status === "success" && data.lookup === "notFound";
  useEffect(() => {
    if (noVideo && musicId != null) markUnplayable(musicId);
  }, [noVideo, musicId, markUnplayable]);

  if (status === "error") return { canPlay: false, blocked: PLAYBACK_BLOCKED.lookupFailed, retry };
  if (noVideo) return { canPlay: false, blocked: PLAYBACK_BLOCKED.noVideo, retry };
  if (status === "success" && data.lookup === "unsearched") return { canPlay: false, blocked: PLAYBACK_BLOCKED.notSearched, retry };
  return { canPlay: true, blocked: null, retry };
}

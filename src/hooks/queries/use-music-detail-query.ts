import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { MusicDetail } from "@/types";

export function useMusicDetailQuery(musicId: number | null) {
  return useQuery({
    ...musicDetailQueryOptions(musicId ?? -1),
    enabled: musicId != null,
  });
}

export function musicDetailQueryOptions(musicId: number) {
  return {
    queryKey: QUERY_KEYS.music.detail(musicId),
    queryFn: () => api<MusicDetail>(API_ENDPOINTS.music.detail(musicId)),
    staleTime: Infinity,
  };
}

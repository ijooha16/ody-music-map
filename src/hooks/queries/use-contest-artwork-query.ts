import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { ContestArtworkShape } from "@/types";

export function useContestArtworkQuery(artworkId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.contest.detail(artworkId ?? -1),
    queryFn: () => api<ContestArtworkShape>(API_ENDPOINTS.contest.detail(artworkId!)),
    enabled: artworkId != null,
    staleTime: Infinity,
    retry: 1,
  });
}

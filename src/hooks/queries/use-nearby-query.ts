import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { NearbyResponse } from "@/types";

export function useNearbyQuery(musicId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.map.nearby(musicId ?? -1),
    queryFn: () => api<NearbyResponse>(API_ENDPOINTS.map.nearby(musicId!)),
    enabled: musicId != null,
    staleTime: 5 * 60 * 1000,
  });
}

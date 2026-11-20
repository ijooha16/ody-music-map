import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, CONSTELLATION_MAX_SONGS, QUERY_KEYS } from "@/constants";
import { api } from "@/lib/api";
import type { ConstellationLayout } from "@/types";

export function useConstellationLayoutQuery(musicIds: number[]) {
  const ids = [...new Set(musicIds)].slice(0, CONSTELLATION_MAX_SONGS);
  return useQuery({
    queryKey: QUERY_KEYS.constellation.layout(ids),
    queryFn: () =>
      api<ConstellationLayout>(API_ENDPOINTS.constellation.layout, {
        method: "POST",
        body: JSON.stringify({ musicIds: ids }),
      }),
    enabled: ids.length >= 2,
    staleTime: Infinity,
  });
}

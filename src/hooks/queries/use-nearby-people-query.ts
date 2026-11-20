import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import { api } from "@/lib/api";
import type { NearbySnapshot } from "@/types";

export function useNearbyPeopleQuery(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.realtime.nearby,
    queryFn: () => api<NearbySnapshot>(API_ENDPOINTS.realtime.nearby, { method: "POST" }),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retryDelay: 2_500,
  });
}

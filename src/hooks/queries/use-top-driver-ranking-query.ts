import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS, TOP_DRIVER } from "@/constants";
import type { UserRankingItem } from "@/types";

export function useTopDriverRankingQuery(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.chart.topDriver,
    queryFn: () => api<UserRankingItem[]>(API_ENDPOINTS.chart.topDriver),
    staleTime: TOP_DRIVER.staleMs,
    enabled,
  });
}

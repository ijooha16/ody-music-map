import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { WeeklyRanking } from "@/types";

export function useWeeklyRankingQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.chart.weekly,
    queryFn: () => api<WeeklyRanking>(API_ENDPOINTS.chart.weekly),
    staleTime: 60 * 1000,
  });
}

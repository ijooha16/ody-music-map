import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { ContestLeaderboard } from "@/types";

export function useContestEntriesQuery(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.contest.entries,
    queryFn: () => api<ContestLeaderboard>(API_ENDPOINTS.contest.entries),
    staleTime: 30 * 1000,
    enabled,
  });
}

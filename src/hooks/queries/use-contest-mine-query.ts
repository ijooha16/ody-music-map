import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, CONTEST_SCORING_POLL_MS, QUERY_KEYS } from "@/constants";
import { awaitingScore } from "@/lib/contest-view";
import type { ContestEntry } from "@/types";

export function useContestMineQuery(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.contest.mine,
    queryFn: () => api<ContestEntry[]>(API_ENDPOINTS.contest.mine),
    enabled,
    staleTime: 10 * 1000,
    refetchInterval: (q) => (awaitingScore(q.state.data) ? CONTEST_SCORING_POLL_MS : false),
  });
}

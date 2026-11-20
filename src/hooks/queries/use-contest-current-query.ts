import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { Contest } from "@/types";

export function useContestCurrentQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.contest.current,
    queryFn: () => api<Contest | null>(API_ENDPOINTS.contest.current),
    staleTime: 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { ContestTemplate } from "@/types";

export function useContestTemplatesQuery(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.contest.templates,
    queryFn: () => api<ContestTemplate[]>(API_ENDPOINTS.contest.templates),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}

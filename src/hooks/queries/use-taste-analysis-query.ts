import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { TasteAnalysis } from "@/types";

const IN_PROGRESS_POLL_MS = 3000;

export function useTasteAnalysisQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.taste.analysis,
    queryFn: () => api<TasteAnalysis>(API_ENDPOINTS.taste.analysis),
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.state === "IN_PROGRESS" ? IN_PROGRESS_POLL_MS : false),

    refetchIntervalInBackground: false,
  });
}

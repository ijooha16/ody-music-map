import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";

export function useRetryContestEntryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (artworkId: number) => api<{ artworkId: number }>(API_ENDPOINTS.contest.retry(artworkId), { method: "POST", body: "{}" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.contest.mine }),
  });
}

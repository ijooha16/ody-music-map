import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { ContestMatch, ContestTemplate } from "@/types";

export function useGenerateContestTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: ContestTemplate) =>
      api<ContestMatch>(API_ENDPOINTS.contest.generate, { method: "POST", body: JSON.stringify({ template: t.name, label: t.label }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.playlist.mineAll }),
  });
}

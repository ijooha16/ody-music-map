import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { ContestSubmitResult } from "@/types";

type Input =

  | { title: string; musicIds: number[]; closed: boolean }

  | { title: string; playlistId: number; closed: boolean };

export function useSubmitContestEntryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Input) => api<ContestSubmitResult>(API_ENDPOINTS.contest.entries, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.contest.all });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.playlist.mineAll });
    },
  });
}

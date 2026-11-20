import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";

interface Input {
  playlistName: string;

  musicIds: number[];
}

export function useSaveContestEntryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Input) => api<{ playlistId: number }>(API_ENDPOINTS.contest.save, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.playlist.mineAll }),
  });
}

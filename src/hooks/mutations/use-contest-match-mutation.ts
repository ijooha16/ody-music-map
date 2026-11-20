import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants";
import type { ContestMatch, SketchPoint } from "@/types";

export function useContestMatchMutation() {
  return useMutation({
    mutationFn: (points: SketchPoint[]) => api<ContestMatch>(API_ENDPOINTS.contest.match, { method: "POST", body: JSON.stringify({ points }) }),
  });
}

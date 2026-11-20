import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import { withEntryLike, withVotesLeft } from "@/lib/optimistic";
import { snapshotQueries } from "@/lib/query-snapshot";
import type { Contest, ContestLeaderboard, ContestLikeResult } from "@/types";

interface Input {
  artworkId: number;

  liked: boolean;
}

export function useLikeContestEntryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ artworkId, liked }: Input) => api<ContestLikeResult>(API_ENDPOINTS.contest.like(artworkId), { method: "POST", body: JSON.stringify({ liked }) }),
    onMutate: async ({ artworkId, liked }) => {
      const restore = await snapshotQueries(qc, [QUERY_KEYS.contest.entries, QUERY_KEYS.contest.current]);
      qc.setQueryData<ContestLeaderboard>(QUERY_KEYS.contest.entries, (prev) => withEntryLike(prev, artworkId, liked));
      qc.setQueryData<Contest | null>(QUERY_KEYS.contest.current, (prev) => withVotesLeft(prev, liked));
      return restore;
    },
    onError: (_e, _input, restore) => restore?.(),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.contest.all }),
  });
}

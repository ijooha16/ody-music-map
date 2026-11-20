"use client";

import { useCallback } from "react";
import { useLikeContestEntryMutation } from "@/hooks/mutations/use-like-contest-entry-mutation";
import { roundPhase } from "@/lib/contest-view";
import { useToastStore } from "@/stores/use-toast-store";
import type { Contest, ContestEntry } from "@/types";

export function useContestLike(contest: Contest, meEmail: string | null) {
  const toast = useToastStore((s) => s.show);
  const like = useLikeContestEntryMutation();
  const open = roundPhase(contest) === "OPEN";

  const canLike = useCallback((entry: ContestEntry) => open && !(meEmail != null && entry.ownerEmail === meEmail), [open, meEmail]);

  const toggle = useCallback(
    (entry: ContestEntry) => {
      if (!meEmail) return toast("로그인하면 좋아요를 줄 수 있어요");
      if (!entry.likedByMe && contest.myVotesLeft === 0) return toast("좋아요를 모두 썼어요. 다른 별자리의 좋아요를 거두면 다시 줄 수 있어요");
      like.mutate({ artworkId: entry.artworkId, liked: !entry.likedByMe }, { onError: (e) => toast(e.message) });
    },
    [meEmail, contest.myVotesLeft, like, toast],
  );

  return { toggle, canLike, pending: like.isPending };
}

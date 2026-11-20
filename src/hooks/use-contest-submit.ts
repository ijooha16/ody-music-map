"use client";

import { useCallback } from "react";
import { SKETCH_RULES } from "@/constants";
import { useSubmitContestEntryMutation } from "@/hooks/mutations/use-submit-contest-entry-mutation";
import { roundPhase } from "@/lib/contest-view";
import { useContestStore } from "@/stores/use-contest-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { Contest, ContestEntry, ContestMatch } from "@/types";

export function useContestSubmit({ contest, match, my, loggedIn, onSubmitted }: { contest: Contest; match: ContestMatch | null; my: ContestEntry | null; loggedIn: boolean; onSubmitted?: () => void }) {
  const title = useContestStore((s) => s.title);
  const setTitle = useContestStore((s) => s.setTitle);
  const closed = useContestStore((s) => s.closed);
  const clear = useContestStore((s) => s.clear);
  const toast = useToastStore((s) => s.show);
  const mutation = useSubmitContestEntryMutation();

  const open = roundPhase(contest) === "OPEN";
  const trimmed = title.trim().slice(0, SKETCH_RULES.titleMax);

  const blocked = !match ? "먼저 별을 찾아 주세요" : !loggedIn ? "로그인하면 출품할 수 있어요" : !open ? "접수가 끝났어요" : !trimmed ? "별자리 이름을 지어 주세요" : null;

  const submit = useCallback(() => {
    if (mutation.isPending) return;
    if (blocked || !match) {
      if (blocked) toast(blocked);
      return;
    }
    mutation.mutate(match.template ? { title: trimmed, playlistId: match.template.playlistId, closed } : { title: trimmed, musicIds: match.tracks.map((t) => t.musicId), closed }, {
      onSuccess: () => {
        toast(`「${trimmed}」 출품 완료 · AI 채점이 끝나면 여기에 떠요`);
        clear();
        setTitle("");
        onSubmitted?.();
      },
      onError: (e) => toast(e.message),
    });
  }, [blocked, match, trimmed, closed, mutation, toast, clear, setTitle, onSubmitted]);

  return { submit, blocked, pending: mutation.isPending, label: my ? "다시 출품하기" : "출품하기" };
}

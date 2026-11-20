"use client";

import { useCallback, useState } from "react";
import { CONTEST_SAVE_DUPLICATED } from "@/constants";
import { useSaveContestEntryMutation } from "@/hooks/mutations/use-save-contest-entry-mutation";
import { ApiError } from "@/lib/api";
import { useToastStore } from "@/stores/use-toast-store";
import type { ContestEntry } from "@/types";

export function useSaveContestToPlaylist(loggedIn: boolean) {
  const toast = useToastStore((s) => s.show);
  const mutation = useSaveContestEntryMutation();
  const [saved, setSaved] = useState<ReadonlySet<number>>(() => new Set());
  const [savingId, setSavingId] = useState<number | null>(null);
  const mark = (id: number) => setSaved((prev) => new Set(prev).add(id));

  const save = useCallback(
    (e: ContestEntry) => {
      if (!loggedIn) return toast("로그인하면 내 플레이리스트로 가져올 수 있어요");
      if (saved.has(e.artworkId)) return toast(CONTEST_SAVE_DUPLICATED);
      setSavingId(e.artworkId);
      mutation.mutate(
        { playlistName: e.title, musicIds: e.tracks.map((t) => t.musicId) },
        {
          onSuccess: () => {
            mark(e.artworkId);
            toast(`「${e.title}」 곡 ${e.tracks.length}개를 내 플레이리스트에 넣었어요 · 순서 그대로`);
          },
          onError: (err) => {
            if (err instanceof ApiError && err.code === "PLAYLIST_NAME_DUPLICATED") {
              mark(e.artworkId);
              return toast(CONTEST_SAVE_DUPLICATED);
            }
            toast(err.message);
          },
          onSettled: () => setSavingId(null),
        },
      );
    },
    [loggedIn, saved, mutation, toast],
  );

  return { save, isSaved: (id: number) => saved.has(id), savingId };
}

"use client";

import { usePlayability } from "@/hooks/queries/use-video-id-query";
import { usePlaySong } from "@/hooks/use-play-song";
import { usePlayerStore } from "@/stores/use-player-store";
import { useToastStore } from "@/stores/use-toast-store";

export function useSongPlayToggle(musicId: number) {
  const playWithConfirm = usePlaySong();
  const pause = usePlayerStore((s) => s.pause);
  const currentMusicId = usePlayerStore((s) => s.currentMusicId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const showToast = useToastStore((s) => s.show);

  const { canPlay, blocked, retry } = usePlayability(musicId);

  const isThisPlaying = canPlay && currentMusicId === musicId && isPlaying;

  const toggle = () => {
    if (blocked) {
      showToast(blocked.notice);

      if (blocked.retryable) retry();
      return;
    }
    if (isThisPlaying) {
      pause();
      return;
    }

    playWithConfirm(musicId);
  };

  return { canPlay, blocked, isThisPlaying, toggle };
}

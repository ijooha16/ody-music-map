"use client";

import { useCallback } from "react";
import { ACTIVITY_CONFIRM, LEAVE_LIST_CONFIRM, RIDING_LOCKED } from "@/constants";
import { playbackActivity, samePlayContext, shouldConfirmListExit, visiblePlayContext } from "@/lib/play-context";
import { DEMO, skipConfirm } from "@/constants/demo";
import { useConfirmStore } from "@/stores/use-confirm-store";
import { isRiding } from "@/stores/use-follow-store";
import { useToastStore } from "@/stores/use-toast-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { useMapStore } from "@/stores/use-map-store";
import { runPlaybackTransition, useBlockingStore } from "@/stores/use-blocking-store";

export function usePlaySong() {
  const confirmAsk = useConfirmStore((s) => s.ask);

  const ask = DEMO ? skipConfirm : confirmAsk;

  return useCallback(
    (musicId: number, after?: () => void) => {
      if (isRiding()) {
        useToastStore.getState().show(RIDING_LOCKED);
        return;
      }
      const map = useMapStore.getState();

      const origin = visiblePlayContext(map, musicId);
      const commit = () => {
        usePlayerStore.getState().playSingle(musicId, origin);
        after?.();
      };
      const { context, queue, currentMusicId } = usePlayerStore.getState();
      if (currentMusicId === musicId && (!origin || samePlayContext(origin, context))) {
        if (!useBlockingStore.getState().busy) commit();
        return;
      }
      const play = () => runPlaybackTransition(commit);
      const currentActivity = playbackActivity(context, queue.length);
      if (origin && currentActivity && !samePlayContext(origin, context)) {
        const next = origin.kind;
        if (next !== "single") {
          ask({
            title: ACTIVITY_CONFIRM.title(next),
            message: ACTIVITY_CONFIRM.message(currentActivity.kind, null, next),
            confirmLabel: ACTIVITY_CONFIRM.confirm,
            cancelLabel: ACTIVITY_CONFIRM.cancel,
            onConfirm: play,
          });
          return;
        }
      }

      if (context.kind === "single" || !shouldConfirmListExit(context, queue, musicId, origin)) {
        play();
        return;
      }
      ask({
        title: LEAVE_LIST_CONFIRM.title,
        message: LEAVE_LIST_CONFIRM.message(context.kind, null),
        confirmLabel: LEAVE_LIST_CONFIRM.confirm,
        cancelLabel: LEAVE_LIST_CONFIRM.cancel,
        onConfirm: play,
      });
    },
    [ask],
  );
}

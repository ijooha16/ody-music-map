"use client";

import { useCallback } from "react";
import { RIDING_JOURNEY_BLOCKED } from "@/constants";
import { useJourneyStore } from "@/stores/use-journey-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { isRiding } from "@/stores/use-follow-store";
import { useToastStore } from "@/stores/use-toast-store";
import { usePlayerStore } from "@/stores/use-player-store";

export function journeyStartFor(
  startMusicId: number | null,
  endMusicId: number | null,
  playingMusicId: number | null,
): number | null {
  if (startMusicId != null || playingMusicId == null) return null;
  return playingMusicId === endMusicId ? null : playingMusicId;
}

export function useOpenJourneyComposer() {
  const openComposer = useJourneyStore((s) => s.openComposer);
  const setStart = useJourneyStore((s) => s.setStart);
  const setPickTarget = useJourneyStore((s) => s.setPickTarget);
  const closePanel = usePanelStore((s) => s.close);

  return useCallback(
    (target?: "start" | "end") => {
      if (isRiding()) {
        useToastStore.getState().show(RIDING_JOURNEY_BLOCKED);
        return;
      }
      closePanel();

      const { startMusicId, endMusicId } = useJourneyStore.getState();
      const start = journeyStartFor(startMusicId, endMusicId, usePlayerStore.getState().currentMusicId);
      if (start != null) setStart(start);
      openComposer();
      if (target) setPickTarget(target);
    },
    [closePanel, openComposer, setStart, setPickTarget],
  );
}

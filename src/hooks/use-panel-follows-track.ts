"use client";

import { useEffect } from "react";
import { panelFollowTarget } from "@/lib/panel-follow";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";

export function usePanelFollowsTrack(): void {
  useEffect(() => {
    let prev = usePlayerStore.getState().currentMusicId;
    return usePlayerStore.subscribe((s) => {
      const next = s.currentMusicId;
      if (next === prev) return;
      const target = panelFollowTarget(usePanelStore.getState(), prev, next);
      prev = next;
      if (target != null) usePanelStore.getState().followSong(target);
    });
  }, []);
}

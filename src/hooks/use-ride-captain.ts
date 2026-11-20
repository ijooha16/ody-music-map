"use client";

import { useEffect } from "react";
import { currentPositionMs, publishPanel, publishPlayback, publishView } from "@/lib/realtime/ride";
import { rideViewOf, sameRideView } from "@/lib/realtime/ride-view";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";

export function useRideCaptain(): void {
  useEffect(() => {
    let wasPlaying = usePlayerStore.getState().isPlaying;
    return usePlayerStore.subscribe((s) => {
      if (s.isPlaying === wasPlaying) return;
      wasPlaying = s.isPlaying;
      if (s.currentMusicId == null) return;
      publishPlayback(s.isPlaying ? "PLAY" : "PAUSE", currentPositionMs());
    });
  }, []);

  useEffect(() => {
    let last: number | null = openSongOf(usePanelStore.getState());
    return usePanelStore.subscribe((s) => {
      const next = openSongOf(s);
      if (next === last) return;
      last = next;
      if (next == null) publishPanel(false);
      else publishPanel(true, next);
    });
  }, []);

  useEffect(() => {
    let last = rideViewOf(useMapStore.getState());
    return useMapStore.subscribe((s) => {
      const next = rideViewOf(s);
      if (sameRideView(next, last)) return;
      last = next;
      publishView(next);
    });
  }, []);
}

function openSongOf(s: { activePanel: string | null; musicId: number | null }): number | null {
  return s.activePanel === "song" ? s.musicId : null;
}

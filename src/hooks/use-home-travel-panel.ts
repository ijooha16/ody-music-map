"use client";

import { useEffect } from "react";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";

export function useHomeTravelPanel(): void {
  useEffect(() => {
    let prev = useMapStore.getState().homeTraveling;
    return useMapStore.subscribe((s) => {
      if (s.homeTraveling === prev) return;
      prev = s.homeTraveling;
      const panel = usePanelStore.getState();
      if (s.homeTraveling) {
        panel.collapse();
        return;
      }
      const id = s.myMusicId ?? usePlayerStore.getState().currentMusicId;
      if (id != null) panel.openSong(id);
    });
  }, []);
}

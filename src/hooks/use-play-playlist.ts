"use client";

import { useCallback } from "react";
import { musicToMapPoint } from "@/lib/map-point";
import { useMapStore } from "@/stores/use-map-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { useStartActivity } from "@/hooks/use-start-activity";
import type { MapPoint, PlaylistDetail } from "@/types";

export function usePlayPlaylist(playlist: PlaylistDetail): (startIndex?: number) => void {
  const playQueue = usePlayerStore((s) => s.playQueue);
  const showConstellation = useMapStore((s) => s.showConstellation);
  const startActivity = useStartActivity();

  return useCallback(
    (startIndex = 0) => {
      const ids = playlist.items.map((it) => it.musicId);
      if (!ids.length) return;

      const points = playlist.items.map((it) => musicToMapPoint(it.music)).filter((p): p is MapPoint => p != null);
      const context = { kind: "playlist", playlistId: playlist.id } as const;

      startActivity("playlist", String(playlist.id), () => {
        if (ids.length >= 2) showConstellation(ids, points, context);
        playQueue(context, ids, startIndex);
      });
    },
    [playlist, playQueue, showConstellation, startActivity],
  );
}

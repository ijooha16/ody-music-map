"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useMusicDetailQuery } from "@/hooks/queries/use-music-detail-query";
import { getMusicHint, getMusicHintOnServer, subscribeMusicHints } from "@/lib/music-hints";
import { resolveMusicLabel, type MusicLabel } from "@/lib/music-label";

export function useMusicLabel(musicId: number | null): MusicLabel {
  const { data } = useMusicDetailQuery(musicId);
  const hint = useSyncExternalStore(
    subscribeMusicHints,
    useCallback(() => getMusicHint(musicId), [musicId]),
    getMusicHintOnServer,
  );

  return resolveMusicLabel(musicId, data, hint);
}

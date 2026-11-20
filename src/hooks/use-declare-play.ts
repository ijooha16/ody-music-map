"use client";

import { useEffect, useRef } from "react";
import { useRecordPlayMutation } from "@/hooks/mutations/use-record-play-mutation";
import { playSourceOf, shouldDeclare } from "@/lib/play-declare";
import { isRiding } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import { usePlayerStore } from "@/stores/use-player-store";

export function useDeclarePlay(): void {
  const declare = useRecordPlayMutation();

  const sent = useRef<number | null>(null);

  useEffect(() => {
    return usePlayerStore.subscribe((s) => {
      if (!shouldDeclare({ musicId: s.currentMusicId, declareSeq: s.declareSeq, lastSeq: sent.current, riding: isRiding() })) return;
      sent.current = s.declareSeq;

      declare.mutate({ musicId: s.currentMusicId!, source: playSourceOf(s.context.kind), layer: useMapStore.getState().layer });
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

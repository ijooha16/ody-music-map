"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { onType } from "@/lib/realtime/stomp-client";
import { useReactionStore } from "@/stores/use-reaction-store";
import type { NearbySnapshot, ReactionPayload } from "@/types";

export function useReactionLive(): void {
  const qc = useQueryClient();
  useEffect(
    () =>
      onType<ReactionPayload>(["REACTION"], (p) => {
        const who = qc.getQueryData<NearbySnapshot>(QUERY_KEYS.realtime.nearby)?.people.find((x) => x.email === p.fromEmail);
        useReactionStore.getState().push({
          reactionKey: p.reactionKey,
          mine: false,
          fromEmail: p.fromEmail,
          nickname: who?.nickname,
        });
      }),
    [qc],
  );
}

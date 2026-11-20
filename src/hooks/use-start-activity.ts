"use client";

import { useCallback } from "react";
import { ACTIVITY_CONFIRM, type ActivityKind } from "@/constants";
import { DEMO, skipConfirm } from "@/constants/demo";
import { useConfirmStore } from "@/stores/use-confirm-store";
import { ownedMapRepresentation, playbackActivity, type PlaybackActivity } from "@/lib/play-context";
import { dismountRide } from "@/hooks/mutations/use-dismount-mutation";
import { useFollowStore } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { runPlaybackTransition } from "@/stores/use-blocking-store";

interface CurrentActivity extends PlaybackActivity {
  detail: string | null;
}

function currentActivity(): CurrentActivity | null {
  const f = useFollowStore.getState();
  if (f.leaderEmail) return { kind: "follow", targetKey: f.leaderEmail, detail: f.leaderNickname };
  const p = usePlayerStore.getState();
  const activity = playbackActivity(p.context, p.queue.length);
  return activity ? { ...activity, detail: null } : null;
}

export function useStartActivity() {
  const confirmAsk = useConfirmStore((s) => s.ask);

  const ask = DEMO ? skipConfirm : confirmAsk;

  const stopCurrent = useCallback(
    (cur: CurrentActivity) => {
      if (cur.kind === "follow") {
        void dismountRide().catch(() => {});
        return;
      }
      usePlayerStore.getState().stop();
      const map = useMapStore.getState();

      const owned = ownedMapRepresentation(map, cur);
      if (owned === "nearby") map.exitNearby();
      else if (owned === "constellation") map.clearConstellation();
    },
    [],
  );

  return useCallback(
    (next: ActivityKind, targetKey: string, begin: () => void) => {
      const cur = currentActivity();
      if (!cur || (cur.kind === next && (cur.targetKey === targetKey || next === "nearby"))) {
        runPlaybackTransition(begin);
        return;
      }
      ask({
        title: ACTIVITY_CONFIRM.title(next),
        message: ACTIVITY_CONFIRM.message(cur.kind, cur.detail, next),
        confirmLabel: ACTIVITY_CONFIRM.confirm,
        cancelLabel: ACTIVITY_CONFIRM.cancel,
        onConfirm: () => runPlaybackTransition(() => {
          stopCurrent(cur);
          begin();
        }),
      });
    },
    [ask, stopCurrent],
  );
}

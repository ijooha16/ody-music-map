import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, CHANGED, RIDE_CAPTAIN_UNREACHABLE, RIDE_REJECTED } from "@/constants";
import { api, ApiError } from "@/lib/api";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { rideLayerTarget } from "@/components/map/engine/ride-layer";
import { joinAndWait } from "@/hooks/use-presence-join";
import { endRide, playFrom } from "@/lib/realtime/ride";
import { canRideOptimistically } from "@/lib/realtime/ride-optimistic";
import { ensureSongPoint } from "@/lib/realtime/ride-point";
import { isConnected } from "@/lib/realtime/stomp-client";
import { useFollowStore } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { useToastStore } from "@/stores/use-toast-store";
import type { RideResponse } from "@/types";

export interface RideTarget {
  email: string;
  nickname: string | null;
  imageUrl: string | null;

  musicId?: number | null;
}

export function useRideMutation({ silent = false }: { silent?: boolean } = {}) {
  const showToast = useToastStore((s) => s.show);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (target: RideTarget): Promise<RideResponse> => {
      await joinAndWait();
      let r: RideResponse;
      try {
        r = await mount(target.email);
      } catch (e) {
        if (!(e instanceof ApiError) || e.code !== "PRESENCE_ERROR") throw e;

        await joinAndWait();
        r = await mount(target.email);
      }

      await ensureSongPoint(qc, r.musicId);
      return r;
    },

    onMutate: (target) => {
      const ok = canRideOptimistically({ ridingEmail: useFollowStore.getState().leaderEmail, targetEmail: target.email, silent });
      if (!ok) return undefined;
      const map = useMapStore.getState();
      const before = { musicId: map.myMusicId, layer: map.layer };
      useFollowStore.getState().start({
        email: target.email,
        nickname: target.nickname,
        imageUrl: target.imageUrl,

        musicId: target.musicId ?? map.myMusicId ?? -1,
        snapshotSeq: 0,
      });
      if (target.musicId != null) {
        map.setMyMusicId(target.musicId);
        getMapEngine()?.rideTo(target.musicId);

        const musicId = target.musicId;
        if (!getMapEngine()?.pointOf(musicId)) {
          void ensureSongPoint(qc, musicId).then((ok) => {
            const ride = useFollowStore.getState();
            if (!ok || ride.leaderEmail !== target.email) return;
            useMapStore.getState().setMyMusicId(musicId);
            ride.markPointAdopted();
          });
        }
      }
      return before;
    },

    onSuccess: (r, target) => {
      useMapStore.getState().clearConstellation();
      useFollowStore.getState().start({
        email: r.captainEmail,
        nickname: target.nickname,
        imageUrl: target.imageUrl,
        musicId: r.musicId,
        snapshotSeq: r.snapshotSeq,

        layer: r.layer,
      });
      useFollowStore.getState().setLeaderViewingMusicId(r.panel.open ? r.panel.musicId : null);

      const toLayer = rideLayerTarget(useMapStore.getState().layer, r.layer);
      if (toLayer != null) getMapEngine()?.rideToLayer(toLayer, r.musicId);

      useMapStore.getState().setMyMusicId(r.musicId);

      playFrom(r.musicId, r.positionMs, r.playback === "PLAYING");

      const leaderPanel = r.panel.open && r.panel.musicId != null ? r.panel.musicId : null;
      const songToOpen = leaderPanel ?? (silent ? null : r.musicId);
      if (songToOpen != null) usePanelStore.getState().openSong(songToOpen);

      if (!silent) showToast(CHANGED.rideStarted(target.nickname ?? target.email));
    },

    onError: (e, _target, before) => {
      if (before) endRide(before);
      if (silent) return;
      const code = e instanceof ApiError ? e.code : "UNKNOWN";

      if (code === "PRESENCE_ERROR" && isConnected()) {
        showToast(RIDE_CAPTAIN_UNREACHABLE);
        return;
      }
      showToast(RIDE_REJECTED[code as keyof typeof RIDE_REJECTED] ?? RIDE_REJECTED.UNKNOWN);
    },
  });
}

const mount = (captainEmail: string) =>
  api<RideResponse>(API_ENDPOINTS.realtime.ride, { method: "POST", body: JSON.stringify({ captainEmail }) });

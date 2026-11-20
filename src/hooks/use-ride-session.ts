"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, NO_GENRE_ID, QUERY_KEYS, REALTIME, RIDE_ENDED_BY_DISBAND, RIDE_REJECTED, RIDE_RESUME_FAILED, STORAGE_KEYS } from "@/constants";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { rideLayerTarget } from "@/components/map/engine/ride-layer";
import { useRideMutation, type RideTarget } from "@/hooks/mutations/use-ride-mutation";
import { api } from "@/lib/api";
import { musicToMapPoint } from "@/lib/map-point";
import { onConnectionChange, onType } from "@/lib/realtime/stomp-client";
import { readStorage } from "@/lib/storage";
import { correctDrift, endRide, playFrom, positionNow, syncPlayback } from "@/lib/realtime/ride";
import { ensureSongPoint } from "@/lib/realtime/ride-point";
import { cancelResume, resumeRide } from "@/lib/realtime/ride-resume";
import { useFollowStore } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { useToastStore } from "@/stores/use-toast-store";
import type {
  JourneyRoute,
  MapPoint,
  PlaylistDetail,
  PresenceErrorPayload,
  RideEndedPayload,
  RidePanelPayload,
  RidePlaybackPayload,
  RideRiderJoinedPayload,
  RideRiderLeftPayload,
  RideTrackPayload,
  RideViewPayload,
  UserProfile,
} from "@/types";

export function useRideSession(): void {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const { mutateAsync: remount } = useRideMutation({ silent: true });

  const giveUp = (target: RideTarget, code: string) => {
    const map = useMapStore.getState();
    endRide({ musicId: map.myMusicId, layer: map.layer });
    const reason = code !== "UNKNOWN" && code in RIDE_REJECTED ? RIDE_REJECTED[code as keyof typeof RIDE_REJECTED] : null;
    showToast(reason ?? RIDE_RESUME_FAILED(target.nickname ?? target.email));
    if (usePanelStore.getState().activePanel === "friends") void qc.refetchQueries({ queryKey: QUERY_KEYS.realtime.nearby });
  };

  useEffect(() => {
    let trackSeq = 0;
    const stopTrack = onType<RideTrackPayload>(["RIDE_TRACK"], (p) => {
      if (!useFollowStore.getState().leaderEmail) return;

      const receivedAt = Date.now();
      const startMs = positionNow(0, "PLAYING", p.serverTs);

      const seq = ++trackSeq;

      const detail = ensureSongPoint(qc, p.musicId);
      const deadline = new Promise<void>((resolve) => setTimeout(resolve, REALTIME.rideTrackTitleWaitMs));
      void Promise.race([detail, deadline]).then(() => {
        if (seq !== trackSeq) return;
        const ride = useFollowStore.getState();
        if (!ride.leaderEmail) return;
        applyTrack(p, startMs, receivedAt);
      });
    });

    function applyTrack(p: RideTrackPayload, startMs: number, receivedAt: number) {
      const ride = useFollowStore.getState();
      ride.setLeaderMusicId(p.musicId);
      ride.setLeaderLayer(p.layer);

      const toLayer = rideLayerTarget(useMapStore.getState().layer, p.layer);
      if (toLayer != null) getMapEngine()?.rideToLayer(toLayer);
      useMapStore.getState().setMyMusicId(p.musicId);

      getMapEngine()?.rideTo(p.musicId);
      if (p.playable) playFrom(p.musicId, startMs, true, receivedAt);
      else usePlayerStore.getState().pause();
    }

    const stopPlayback = onType<RidePlaybackPayload>(["RIDE_PLAYBACK"], (p) => {
      if (!useFollowStore.getState().leaderEmail) return;
      syncPlayback(positionNow(p.positionMs, p.state, p.serverTs), p.state);
    });

    const stopPanel = onType<RidePanelPayload>(["RIDE_PANEL"], (p) => {
      if (!useFollowStore.getState().leaderEmail) return;
      const panel = usePanelStore.getState();

      useFollowStore.getState().setLeaderViewingMusicId(p.open ? p.musicId : null);
      if (!p.open || p.musicId == null) {
        panel.close();
        return;
      }
      getMapEngine()?.rideViewing(p.musicId);
      useMapStore.getState().selectMusic(p.musicId);
      panel.openSong(p.musicId);
    });

    let viewSeq = 0;
    const stopView = onType<RideViewPayload>(["RIDE_VIEW"], (p) => {
      if (!useFollowStore.getState().leaderEmail) return;
      const seq = ++viewSeq;
      const map = useMapStore.getState();
      const fresh = () => seq === viewSeq && !!useFollowStore.getState().leaderEmail;
      if (p.kind === "nearby" && p.centerMusicId != null) {
        map.enterNearby(p.centerMusicId, true);
        return;
      }
      if (p.kind === "journey" && p.startMusicId != null && p.endMusicId != null) {
        const start = p.startMusicId;
        const end = p.endMusicId;
        void qc
          .fetchQuery({
            queryKey: QUERY_KEYS.journey.route(start, end),
            queryFn: () => api<JourneyRoute>(`${API_ENDPOINTS.journey.route}?start=${start}&end=${end}`),
            staleTime: 10 * 60 * 1000,
          })
          .then((route) => {
            if (!fresh() || route.stops.length < 2) return;

            useMapStore.getState().showConstellation(
              route.stops.map((s) => s.id),
              route.stops.map((s) => ({ musicId: s.id, pc: s.pc, genreId: NO_GENRE_ID, weight: 1, title: s.title, artist: s.artist, youtubeUrl: null, playable: true })),
              { kind: "journey", startMusicId: route.startMusicId, endMusicId: route.endMusicId },
            );
          })
          .catch(() => {
            /* 나만 빈 화면 — 인솔자 쪽 잘못이 아니라 알리지 않는다 */
          });
        return;
      }
      if (p.kind === "playlist" && p.playlistId != null) {
        const playlistId = p.playlistId;
        void qc
          .fetchQuery({ queryKey: QUERY_KEYS.playlist.detail(playlistId), queryFn: () => api<PlaylistDetail>(API_ENDPOINTS.playlist.detail(playlistId)) })
          .then((pl) => {
            if (!fresh() || pl.items.length < 2) return;
            useMapStore.getState().showConstellation(
              pl.items.map((it) => it.musicId),
              pl.items.map((it) => musicToMapPoint(it.music)).filter((pt): pt is MapPoint => pt != null),
              { kind: "playlist", playlistId },
            );
          })
          .catch(() => {
            /* 위와 같다 */
          });
        return;
      }

      if (map.viewMode === "nearby") map.exitNearby();
      else if (map.viewMode === "constellation") map.clearConstellation();
    });

    const stopEnded = onType<RideEndedPayload>(["RIDE_ENDED"], (p) => {
      const s = useFollowStore.getState();
      const who = s.leaderNickname ?? p.captainEmail;
      if (p.reason === "CAPTAIN_ENDED" || !s.leaderEmail) {
        endRide(p);
        showToast(RIDE_ENDED_BY_DISBAND(who));

        refetchNearbyIfOpen();
        return;
      }
      const target: RideTarget = { email: s.leaderEmail, nickname: s.leaderNickname, imageUrl: s.leaderImageUrl };

      s.setReconnecting(true);
      resumeRide(target, remount, (code) => giveUp(target, code));
    });

    const stopJoined = onType<RideRiderJoinedPayload>(["RIDE_RIDER_JOINED"], (p) => {
      const ride = useFollowStore.getState();
      ride.setFollowerCount(p.riderCount);
      ride.addRider({ email: p.email, nickname: p.nickname, imageUrl: null });

      void qc
        .fetchQuery({ queryKey: QUERY_KEYS.user.profile(p.email), queryFn: () => api<UserProfile>(API_ENDPOINTS.user.detail(p.email)), staleTime: 5 * 60 * 1000 })
        .then((u) => useFollowStore.getState().setRiderImage(p.email, u.imageUrl))
        .catch(() => {
          /* 얼굴 없이 간다 */
        });
    });
    const stopLeft = onType<RideRiderLeftPayload>(["RIDE_RIDER_LEFT"], (p) => {
      const ride = useFollowStore.getState();
      ride.setFollowerCount(p.riderCount);
      ride.removeRider(p.email);
    });

    const stopErr = onType<PresenceErrorPayload>(["PRESENCE_ERROR"], (p) => {
      if (p.code !== "RIDE_NOT_CAPTAIN") return;
      if (process.env.NODE_ENV !== "production") console.warn("[ride] 동승 중에 막힌 조작이 나갔다 — UI 잠금이 빠졌다", p);
    });

    const driftTimer = setInterval(correctDrift, REALTIME.rideDriftCheckMs);

    return () => {
      clearInterval(driftTimer);
      stopTrack();
      stopPlayback();
      stopPanel();
      stopView();
      stopEnded();
      stopJoined();
      stopLeft();
      stopErr();
      cancelResume();
    };

    function refetchNearbyIfOpen() {
      if (usePanelStore.getState().activePanel !== "friends") return;
      void qc.refetchQueries({ queryKey: QUERY_KEYS.realtime.nearby });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- giveUp 은 qc·showToast 만 닫아 두고, 그 둘이 deps 다
  }, [qc, showToast, remount]);

  useEffect(
    () =>
      onConnectionChange((up) => {
        if (!up) return;
        const s = useFollowStore.getState();

        s.setFollowerCount(0);
        s.setRiders([]);
        const target: RideTarget | null = s.leaderEmail
          ? { email: s.leaderEmail, nickname: s.leaderNickname, imageUrl: s.leaderImageUrl }
          : readStorage<RideTarget>(STORAGE_KEYS.rideLeader);
        if (!target) return;
        resumeRide(target, remount, (code) => giveUp(target, code));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- giveUp 은 qc·showToast 만 닫아 둔다
    [remount, qc, showToast],
  );
}

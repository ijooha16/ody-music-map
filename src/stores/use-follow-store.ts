import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { STORAGE_KEYS } from "@/constants";
import { removeStorage, writeStorage } from "@/lib/storage";
import type { RideRider } from "@/types";

interface FollowState {
  leaderEmail: string | null;
  leaderNickname: string | null;
  leaderImageUrl: string | null;

  leaderMusicId: number | null;

  leaderLayer: number | null;

  leaderViewingMusicId: number | null;

  followerCount: number;

  snapshotSeq: number;

  pointRevision: number;

  riders: RideRider[];

  reconnecting: boolean;

  start: (input: {
    email: string;
    nickname: string | null;
    imageUrl: string | null;
    musicId: number;
    snapshotSeq: number;
    layer?: number | null;
  }) => void;

  setLeaderMusicId: (musicId: number) => void;
  setLeaderLayer: (layer: number | null) => void;

  setLeaderViewingMusicId: (musicId: number | null) => void;

  stop: () => void;
  setFollowerCount: (n: number) => void;

  markPointAdopted: () => void;
  addRider: (rider: RideRider) => void;
  removeRider: (email: string) => void;
  setRiderImage: (email: string, imageUrl: string | null) => void;
  setRiders: (riders: RideRider[]) => void;
  setReconnecting: (reconnecting: boolean) => void;
}

export const useFollowStore = create<FollowState>()(
  devtools(
    (set) => ({
      leaderEmail: null,
      leaderNickname: null,
      leaderImageUrl: null,
      leaderMusicId: null,
      leaderLayer: null,
      leaderViewingMusicId: null,
      followerCount: 0,
      snapshotSeq: 0,
      pointRevision: 0,
      riders: [],
      reconnecting: false,

      start: ({ email, nickname, imageUrl, musicId, snapshotSeq, layer = null }) => {
        writeStorage(STORAGE_KEYS.rideLeader, { email, nickname, imageUrl }, "session");
        set(
          {
            leaderEmail: email,
            leaderNickname: nickname,
            leaderImageUrl: imageUrl,
            leaderMusicId: musicId,
            leaderLayer: layer,
            leaderViewingMusicId: null,
            snapshotSeq,
          },
          false,
          "start",
        );
      },
      setLeaderMusicId: (leaderMusicId) => set({ leaderMusicId }, false, "setLeaderMusicId"),
      setLeaderLayer: (leaderLayer) => set({ leaderLayer }, false, "setLeaderLayer"),
      setLeaderViewingMusicId: (leaderViewingMusicId) => set({ leaderViewingMusicId }, false, "setLeaderViewingMusicId"),
      stop: () => {
        removeStorage(STORAGE_KEYS.rideLeader);
        set(
          {
            leaderEmail: null,
            leaderNickname: null,
            leaderImageUrl: null,
            leaderMusicId: null,
            leaderLayer: null,
            leaderViewingMusicId: null,
            snapshotSeq: 0,
            followerCount: 0,
            riders: [],
            reconnecting: false,
          },
          false,
          "stop",
        );
      },
      setFollowerCount: (followerCount) => set({ followerCount }, false, "setFollowerCount"),
      markPointAdopted: () => set((s) => ({ pointRevision: s.pointRevision + 1 }), false, "markPointAdopted"),

      addRider: (rider) => set((s) => ({ riders: [...s.riders.filter((r) => r.email !== rider.email), rider] }), false, "addRider"),
      removeRider: (email) => set((s) => ({ riders: s.riders.filter((r) => r.email !== email) }), false, "removeRider"),
      setRiderImage: (email, imageUrl) => set((s) => ({ riders: s.riders.map((r) => (r.email === email ? { ...r, imageUrl } : r)) }), false, "setRiderImage"),
      setRiders: (riders) => set({ riders }, false, "setRiders"),
      setReconnecting: (reconnecting) => set((s) => (s.reconnecting === reconnecting ? s : { reconnecting }), false, "setReconnecting"),
    }),
    { name: "follow-store" },
  ),
);

export const isRiding = () => useFollowStore.getState().leaderEmail != null;

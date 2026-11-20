import { create } from "zustand";
import { useFollowStore } from "./use-follow-store";
import { devtools } from "zustand/middleware";
import type { PanelType } from "@/constants";
import { pushHistory, snapshotOf, type FollowType, type PanelReturn } from "@/lib/panel-history";
import { useJourneyStore } from "./use-journey-store";
import { useMapStore } from "./use-map-store";

function hideMapView() {
  const map = useMapStore.getState();
  map.hideConstellationView();
  if (map.viewMode === "nearby") map.exitNearby();
}

function syncMapView(next: PanelType) {
  const map = useMapStore.getState();
  if (next !== "song" && map.viewMode === "nearby") map.exitNearby();
  if (next !== "song" && next !== "journey" && next !== "playlist") map.hideConstellationView();
}

function hideComposer() {
  if (useJourneyStore.getState().isComposerOpen) useJourneyStore.getState().closeComposer();
}

const open = (panel: PanelType, patch: object = {}) => {
  syncMapView(panel);
  hideComposer();
  return { activePanel: panel, history: [] as PanelReturn[], feedFollows: null, snap: OPEN_SNAP, ...patch } as const;
};

function patchOf(target: PanelReturn): object {
  switch (target.panel) {
    case "song":
      return { musicId: target.musicId };
    case "playlist":
      return { playlistId: target.playlistId };
    case "feed":
      return { profileEmail: target.profileEmail, feedFollows: target.follows ?? null };
    default:
      return {};
  }
}

export type { FollowType, PanelReturn };

export type SheetSnap = 1 | 2 | 3;

const OPEN_SNAP: SheetSnap = 2;

interface PanelState {
  activePanel: PanelType | null;

  musicId: number | null;

  playlistId: number | null;

  profileEmail: string | null;

  history: PanelReturn[];

  feedFollows: FollowType | null;

  snap: SheetSnap;

  openSong: (musicId: number) => void;

  openSongFromMap: (musicId: number, snap?: SheetSnap) => void;

  drill: (target: PanelReturn) => void;

  openSongFromList: (musicId: number) => void;

  openNeighborSong: (musicId: number) => void;

  goBack: () => PanelReturn | null;

  openFollows: (type: FollowType) => void;
  closeFollows: () => void;

  followSong: (musicId: number) => void;
  openPlaylist: (playlistId: number) => void;

  openFeed: (email?: string | null) => void;

  openJourney: (snap?: SheetSnap) => void;
  openFriends: () => void;
  openChart: () => void;

  toggle: (panel: PanelType, snap?: SheetSnap) => void;
  close: () => void;

  toggleCollapsed: () => void;

  raiseSnap: () => void;

  lowerSnap: () => void;

  setSnap: (snap: SheetSnap) => void;

  sheetStop: number | null;
  setSheetStop: (px: number | null) => void;

  sheetPeek: number | null;
  setSheetPeek: (px: number | null) => void;

  collapse: () => void;
}

export const usePanelStore = create<PanelState>()(
  devtools(
    (set, get) => ({
      activePanel: null,
      musicId: null,
      playlistId: null,
      profileEmail: null,
      history: [],
      feedFollows: null,
      snap: OPEN_SNAP,
      sheetStop: null,
      sheetPeek: null,

      openSong: (musicId) => set(open("song", { musicId }), false, "openSong"),
      followSong: (musicId) => set((s) => (s.activePanel === "song" && s.musicId !== musicId ? { musicId } : {}), false, "followSong"),

      openSongFromMap: (musicId, snap) => set(open("song", snap ? { musicId, snap } : { musicId }), false, "openSongFromMap"),

      drill: (target) =>
        set(
          (s) => {
            const history = pushHistory(s.history, snapshotOf(s), target);

            const snap = target.panel === "song" ? { snap: 3 as SheetSnap } : {};
            return { ...open(target.panel, patchOf(target)), ...snap, history };
          },
          false,
          `drill/${target.panel}`,
        ),

      openSongFromList: (musicId) => get().drill({ panel: "song", musicId }),

      openNeighborSong: (musicId) => get().drill({ panel: "song", musicId }),

      goBack: () => {
        const history = get().history;
        const target = history[history.length - 1];
        if (!target) return null;
        syncMapView(target.panel);
        set({ activePanel: target.panel, ...patchOf(target), history: history.slice(0, -1), snap: OPEN_SNAP }, false, `goBack/${target.panel}`);
        return target;
      },

      openFollows: (type) => set((s) => (s.activePanel === "feed" ? { feedFollows: type } : {}), false, "openFollows"),
      closeFollows: () => set({ feedFollows: null }, false, "closeFollows"),

      openPlaylist: (playlistId) => set(open("playlist", { playlistId }), false, "openPlaylist"),
      openFeed: (email = null) => set(open("feed", { profileEmail: email }), false, "openFeed"),
      openJourney: (snap) => set(open("journey", snap ? { snap } : {}), false, "openJourney"),
      openFriends: () => set(open("friends"), false, "openFriends"),
      openChart: () => set(open("chart"), false, "openChart"),

      toggle: (panel, snap) => {
        if (get().activePanel === panel) {
          hideMapView();
          set({ activePanel: null, history: [], feedFollows: null }, false, "toggle/close");
          return;
        }
        const at = snap ? { snap } : {};
        if (panel === "feed") set(open("feed", { profileEmail: null, ...at }), false, "toggle/feed");
        else set(open(panel, at), false, `toggle/${panel}`);
      },

      close: () => {
        const ride = useFollowStore.getState();
        const riding = ride.leaderViewingMusicId ?? ride.leaderMusicId;
        if (ride.leaderEmail && riding != null) {
          syncMapView("song");
          set({ activePanel: "song", musicId: riding, history: [], feedFollows: null, snap: 1 }, false, "close/riding");
          return;
        }
        hideMapView();
        set({ activePanel: null, history: [], feedFollows: null, snap: OPEN_SNAP }, false, "close");
      },

      toggleCollapsed: () => set((s) => ({ snap: s.snap === 1 ? 3 : 1 }) as const, false, "toggleCollapsed"),

      raiseSnap: () => set((s) => ({ snap: (s.snap === 3 ? 1 : s.snap + 1) as SheetSnap }), false, "raiseSnap"),

      lowerSnap: () => {
        const snap = get().snap;
        if (snap === 1) return void get().close();
        set({ snap: (snap - 1) as SheetSnap }, false, "lowerSnap");
      },

      setSnap: (snap) => set((s) => (s.snap === snap ? {} : { snap }), false, "setSnap"),
      setSheetStop: (px) => set((s) => (s.sheetStop === px ? {} : { sheetStop: px }), false, "setSheetStop"),
      setSheetPeek: (px) => set((s) => (s.sheetPeek === px ? {} : { sheetPeek: px }), false, "setSheetPeek"),

      collapse: () =>

        set((s) => (s.activePanel && s.snap !== 1 ? { snap: 1 as SheetSnap } : {}), false, "collapse"),
    }),
    { name: "panel-store" },
  ),
);

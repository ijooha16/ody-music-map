import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { MapViewMode } from "@/constants";
import type { LayerBox, MapCamera, MapPoint } from "@/types";
import type { GoHomeResult } from "@/components/map/engine/map-engine";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import type { PlayContext } from "./use-player-store";

const EMPTY_IDS: number[] = [];
const EMPTY_POINTS: MapPoint[] = [];
const EMPTY_BOXES: LayerBox[] = [];

export interface EngineSnapshot {
  layer: number;

  boxes: readonly LayerBox[];

  prefetchBoxes: readonly LayerBox[] | null;
  camera: MapCamera;

  residentCount: number;

  viewportCount: number;

  zoomK: number;

  gateOpen: boolean;

  gateProgress: number;

  gateAtCount: number;

  atBottom: boolean;

  canRise: boolean;

  pressure: number;
  pressureDir: 1 | -1 | 0;

  morph: { big: string } | null;

  myMusicId: number | null;

  home: { musicId: number; boxes: readonly LayerBox[] } | null;

  ghostMusicId: number | null;

  playingElsewhere: boolean;

  canGoHome: boolean;

  homeTraveling: boolean;
}

interface MapState extends EngineSnapshot {
  viewMode: MapViewMode;
  selectedMusicId: number | null;

  nearbyCenterMusicId: number | null;

  constellationMusicIds: number[];

  constellationPoints: MapPoint[];

  constellationSource: PlayContext | null;

  setViewMode: (mode: MapViewMode) => void;
  selectMusic: (musicId: number | null) => void;
  setMyMusicId: (musicId: number | null) => void;

  enterNearby: (musicId: number, panelHandled?: boolean) => void;
  exitNearby: () => void;

  nearbyPanelHandled: boolean;

  showConstellation: (musicIds: number[], points: MapPoint[] | undefined, source: PlayContext) => void;

  setConstellationList: (musicIds: number[], points: MapPoint[] | undefined, source: PlayContext) => void;

  toggleConstellationView: () => void;

  hideConstellationView: () => void;

  clearConstellation: () => void;

  focusMusic: (musicId: number) => void;

  revealMusic: (musicId: number, point?: MapPoint | null) => void;

  dismissGhost: () => void;

  surfaceToMusic: (musicId: number) => void;

  goHome: () => GoHomeResult;

  drillDown: () => void;

  surface: () => void;

  surfaceTo: (layer: number) => void;

  syncFromEngine: (snap: Partial<EngineSnapshot>) => void;
}

export const useMapStore = create<MapState>()(
  devtools(
    (set, get) => ({
      layer: 0,
      boxes: EMPTY_BOXES,
      prefetchBoxes: null,
      camera: { cx: 0, cy: 0, s: 100 },
      residentCount: 0,
      viewportCount: 0,
      zoomK: 1,
      gateOpen: false,
      gateProgress: 0,
      gateAtCount: 0,
      atBottom: false,
      canRise: false,
      pressure: 0,
      pressureDir: 0,
      morph: null,
      myMusicId: null,
      home: null,
      ghostMusicId: null,
      playingElsewhere: false,
      canGoHome: false,
      homeTraveling: false,

      viewMode: "default",
      nearbyPanelHandled: false,
      selectedMusicId: null,
      nearbyCenterMusicId: null,
      constellationMusicIds: EMPTY_IDS,
      constellationSource: null,
      constellationPoints: EMPTY_POINTS,

      setViewMode: (viewMode) => set({ viewMode }, false, "setViewMode"),
      selectMusic: (selectedMusicId) => set({ selectedMusicId }, false, "selectMusic"),
      setMyMusicId: (myMusicId) => {
        const engine = getMapEngine();

        if (myMusicId != null && engine && !engine.acceptsAnchor(myMusicId)) return;
        set({ myMusicId }, false, "setMyMusicId");
        engine?.setMy(myMusicId);
      },

      enterNearby: (musicId, panelHandled = false) => {
        set(
          {
            viewMode: "nearby",
            nearbyCenterMusicId: musicId,
            selectedMusicId: musicId,
            nearbyPanelHandled: panelHandled,
            constellationMusicIds: EMPTY_IDS,
            constellationPoints: EMPTY_POINTS,
            constellationSource: null,
          },
          false,
          "enterNearby",
        );
      },
      exitNearby: () => set({ viewMode: "default", nearbyCenterMusicId: null, nearbyPanelHandled: false }, false, "exitNearby"),

      showConstellation: (constellationMusicIds, points = EMPTY_POINTS, constellationSource) =>
        set(
          { viewMode: "constellation", constellationMusicIds, constellationPoints: points, constellationSource, nearbyCenterMusicId: null },
          false,
          "showConstellation",
        ),
      setConstellationList: (constellationMusicIds, points = EMPTY_POINTS, constellationSource) =>
        set({ constellationMusicIds, constellationPoints: points, constellationSource }, false, "setConstellationList"),
      toggleConstellationView: () =>
        set(
          (s) =>
            s.viewMode === "constellation"
              ? { viewMode: "default" }
              : { viewMode: "constellation", nearbyCenterMusicId: null },
          false,
          "toggleConstellationView",
        ),
      hideConstellationView: () => set((s) => (s.viewMode === "constellation" ? { viewMode: "default" } : {}), false, "hideConstellationView"),
      clearConstellation: () =>
        set(
          (s) => ({
            viewMode: s.viewMode === "constellation" ? "default" : s.viewMode,
            constellationMusicIds: EMPTY_IDS,
            constellationPoints: EMPTY_POINTS,
            constellationSource: null,
          }),
          false,
          "clearConstellation",
        ),

      focusMusic: (musicId) => {
        const engine = getMapEngine();
        set({ selectedMusicId: musicId }, false, "focusMusic");

        if (engine?.isAlive(musicId)) engine.focusSong(musicId);
        else engine?.setGhost(musicId);
      },

      revealMusic: (musicId, point) => {
        const engine = getMapEngine();
        set({ selectedMusicId: musicId }, false, "revealMusic");
        if (!engine) return;

        if (point && !engine.isAlive(musicId)) engine.adopt([point]);

        if (engine.revealSong(musicId) === "none") engine.setGhost(musicId);
      },
      dismissGhost: () => {
        getMapEngine()?.clearGhost();
        set({ ghostMusicId: null }, false, "dismissGhost");
      },
      surfaceToMusic: (musicId) => {
        set({ selectedMusicId: musicId }, false, "surfaceToMusic");
        getMapEngine()?.surfaceToSong(musicId);
      },

      goHome: () => {
        const engine = getMapEngine();
        if (!engine) return "none";
        const { viewMode } = get();
        if (viewMode === "nearby") {
          engine.exitProbe();
          get().exitNearby();
        } else if (viewMode === "constellation") {
          engine.exitConstellation();
          get().hideConstellationView();
        }
        return engine.goHome();
      },
      drillDown: () => getMapEngine()?.descend(),
      surface: () => getMapEngine()?.ascend(),
      surfaceTo: (layer) => getMapEngine()?.ascendTo(layer),

      syncFromEngine: (snap) => set(snap, false, "syncFromEngine"),
    }),
    { name: "map-store" },
  ),
);

export const isConstellationOpen = (s: MapState) => s.viewMode === "constellation" && s.constellationMusicIds.length >= 2;

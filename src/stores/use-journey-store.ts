import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type JourneyPickTarget = "start" | "end" | null;

interface JourneyState {
  isComposerOpen: boolean;
  startMusicId: number | null;
  endMusicId: number | null;

  pickTarget: JourneyPickTarget;

  isRouteRequested: boolean;

  openComposer: () => void;
  closeComposer: () => void;
  setStart: (musicId: number | null) => void;
  setEnd: (musicId: number | null) => void;

  pickForNext: (musicId: number) => void;
  setPickTarget: (target: JourneyPickTarget) => void;
  swap: () => void;
  requestRoute: () => void;
  reset: () => void;
}

export const useJourneyStore = create<JourneyState>()(
  devtools(
    (set, get) => ({
      isComposerOpen: false,
      startMusicId: null,
      endMusicId: null,
      pickTarget: null,
      isRouteRequested: false,

      openComposer: () => set({ isComposerOpen: true, pickTarget: get().startMusicId == null ? "start" : "end" }, false, "openComposer"),
      closeComposer: () => set({ isComposerOpen: false, pickTarget: null }, false, "closeComposer"),

      setStart: (startMusicId) => set({ startMusicId, isRouteRequested: false, pickTarget: startMusicId == null ? "start" : "end" }, false, "setStart"),
      setEnd: (endMusicId) => set({ endMusicId, isRouteRequested: false, pickTarget: "end" }, false, "setEnd"),

      pickForNext: (musicId) => {
        const { pickTarget, startMusicId } = get();
        const target = pickTarget ?? (startMusicId == null ? "start" : "end");
        if (target === "end") set({ endMusicId: musicId, isRouteRequested: false, pickTarget: "end" }, false, "pickForNext/end");

        else set({ startMusicId: musicId, isRouteRequested: false, pickTarget: "end" }, false, "pickForNext/start");
      },

      setPickTarget: (pickTarget) => set({ pickTarget }, false, "setPickTarget"),
      swap: () => set((s) => ({ startMusicId: s.endMusicId, endMusicId: s.startMusicId, isRouteRequested: false }), false, "swap"),
      requestRoute: () => set({ isRouteRequested: true, isComposerOpen: false, pickTarget: null }, false, "requestRoute"),
      reset: () => set({ startMusicId: null, endMusicId: null, isRouteRequested: false, pickTarget: null }, false, "reset"),
    }),
    { name: "journey-store" },
  ),
);

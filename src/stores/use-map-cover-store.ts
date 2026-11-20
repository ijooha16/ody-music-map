import { create } from "zustand";

interface MapCoverState {
  covers: number;
  cover: () => void;
  uncover: () => void;
}

export const useMapCoverStore = create<MapCoverState>()((set) => ({
  covers: 0,
  cover: () => set((s) => ({ covers: s.covers + 1 })),
  uncover: () => set((s) => ({ covers: Math.max(0, s.covers - 1) })),
}));

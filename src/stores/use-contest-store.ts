import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ContestTab, SketchStep } from "@/constants";
import type { ContestMatch, ContestSort, SketchPoint } from "@/types";

const EMPTY_POINTS: SketchPoint[] = [];

interface ContestState {
  open: boolean;
  tab: ContestTab;
  sort: ContestSort;
  points: SketchPoint[];

  closed: boolean;
  match: ContestMatch | null;
  title: string;

  step: SketchStep;

  toggleOpen: () => void;

  openAt: (tab: ContestTab) => void;
  close: () => void;
  setTab: (tab: ContestTab) => void;
  setSort: (sort: ContestSort) => void;
  addPoint: (p: SketchPoint) => void;
  removePoint: (index: number) => void;
  undo: () => void;
  clear: () => void;
  toggleClosed: () => void;
  setMatch: (match: ContestMatch | null) => void;
  setTitle: (title: string) => void;
  setStep: (step: SketchStep) => void;
}

const invalidate = { match: null } as const;

export const useContestStore = create<ContestState>()(
  devtools(
    (set) => ({
      open: false,
      tab: "sketch",
      sort: "latest",
      points: EMPTY_POINTS,
      closed: false,
      match: null,
      title: "",
      step: "draw",

      toggleOpen: () => set((s) => ({ open: !s.open }), false, "toggleOpen"),
      openAt: (tab) => set({ open: true, tab }, false, "openAt"),
      close: () => set({ open: false }, false, "close"),
      setTab: (tab) => set({ tab }, false, "setTab"),
      setSort: (sort) => set({ sort }, false, "setSort"),
      addPoint: (p) => set((s) => ({ points: [...s.points, p], ...invalidate }), false, "addPoint"),
      removePoint: (index) => set((s) => ({ points: s.points.filter((_, i) => i !== index), ...invalidate }), false, "removePoint"),
      undo: () => set((s) => ({ points: s.points.slice(0, -1), ...invalidate }), false, "undo"),
      clear: () => set({ points: EMPTY_POINTS, closed: false, ...invalidate }, false, "clear"),
      toggleClosed: () => set((s) => ({ closed: !s.closed, ...invalidate }), false, "toggleClosed"),
      setMatch: (match) => set({ match }, false, "setMatch"),
      setTitle: (title) => set({ title }, false, "setTitle"),
      setStep: (step) => set({ step }, false, "setStep"),
    }),
    { name: "contest-store" },
  ),
);

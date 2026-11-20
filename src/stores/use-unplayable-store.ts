import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UnplayableState {
  ids: ReadonlySet<number>;

  markUnplayable: (musicId: number) => void;
}

export const useUnplayableStore = create<UnplayableState>()(
  devtools(
    (set) => ({
      ids: new Set<number>(),
      markUnplayable: (musicId) =>
        set(
          (s) => (s.ids.has(musicId) ? s : { ids: new Set(s.ids).add(musicId) }),
          false,
          "markUnplayable",
        ),
    }),
    { name: "unplayable-store" },
  ),
);


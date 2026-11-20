import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { REACTION_VISIBLE_MS } from "@/constants";

export interface FloatingReaction {
  id: string;

  reactionKey: string;

  mine: boolean;

  fromEmail: string | null;

  nickname?: string | null;
}

interface ReactionState {
  floating: FloatingReaction[];
  push: (reaction: Omit<FloatingReaction, "id">) => void;
}

export const useReactionStore = create<ReactionState>()(
  devtools(
    (set) => ({
      floating: [],

      push: (reaction) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({ floating: [...s.floating, { ...reaction, id }] }), false, "push");
        setTimeout(() => {
          set((s) => ({ floating: s.floating.filter((r) => r.id !== id) }), false, "expire");
        }, REACTION_VISIBLE_MS);
      },
    }),
    { name: "reaction-store" },
  ),
);

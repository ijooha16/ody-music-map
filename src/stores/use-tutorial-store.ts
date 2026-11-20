import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { STORAGE_KEYS, TUTORIAL_STEPS, type TutorialTask } from "@/constants";
import { readStorage, writeStorage } from "@/lib/storage";
import { track } from "@/lib/analytics/client";

interface TutorialState {
  stepIndex: number;
  isDone: boolean;

  complete: (task: TutorialTask) => void;
  skip: () => void;
  finish: () => void;

  hydrateCompletion: (serverCompleted?: boolean) => boolean;
  reset: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  devtools(
    (set, get) => ({
      stepIndex: 0,
      isDone: false,

      complete: (task) => {
        const { stepIndex, isDone } = get();
        if (isDone) return;
        const current = TUTORIAL_STEPS[stepIndex];
        if (!current || current.task !== task) return;
        track("tutorial_step_completed", { step: stepIndex, task });
        const nextIndex = stepIndex + 1;
        if (nextIndex >= TUTORIAL_STEPS.length) { track("tutorial_finished", { result: "completed" }); get().finish(); }
        else { set({ stepIndex: nextIndex }, false, "complete/next"); track("tutorial_step_viewed", { step: nextIndex, task: TUTORIAL_STEPS[nextIndex].task }); }
      },

      finish: () => {
        writeStorage(STORAGE_KEYS.tutorialDone, true);
        set({ isDone: true }, false, "finish");
      },
      skip: () => { if (!get().isDone) track("tutorial_finished", { result: "skipped", step: get().stepIndex }); get().finish(); },
      hydrateCompletion: (serverCompleted = false) => {
        const done = get().isDone || readStorage<boolean>(STORAGE_KEYS.tutorialDone) === true || serverCompleted;
        if (done) get().finish();
        return done;
      },

      reset: () => set({ stepIndex: 0, isDone: false }, false, "reset"),
    }),
    { name: "tutorial-store" },
  ),
);

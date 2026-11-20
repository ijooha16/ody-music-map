import { create } from "zustand";

interface BlockingState {
  gate: ((resume: () => void) => boolean) | null;
  busy: boolean;
  setGate: (gate: BlockingState["gate"]) => void;
  setBusy: (busy: boolean) => void;
}

export const useBlockingStore = create<BlockingState>()((set) => ({
  gate: null,
  busy: false,
  setGate: (gate) => set({ gate }),
  setBusy: (busy) => set({ busy }),
}));

let transactionDepth = 0;

export function runPlaybackTransition(commit: () => void): void {
  if (transactionDepth > 0) { commit(); return; }
  let committed = false;
  const resume = () => {
    if (committed) return;
    committed = true;
    transactionDepth += 1;
    try { commit(); } finally { transactionDepth -= 1; }
  };
  if (useBlockingStore.getState().gate?.(resume) !== true) resume();
}

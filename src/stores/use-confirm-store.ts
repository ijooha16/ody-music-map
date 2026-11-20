import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { track } from "@/lib/analytics/client";

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;

  onConfirm: () => void;
}

interface ConfirmState {
  pending: ConfirmRequest | null;
  ask: (req: ConfirmRequest) => void;
  confirm: () => void;
  cancel: () => void;
}

export const useConfirmStore = create<ConfirmState>()(
  devtools(
    (set, get) => ({
      pending: null,
      ask: (pending) => set({ pending }, false, "ask"),
      confirm: () => {
        const p = get().pending;
        if (p) track("activity_switch_decided", { decision: "confirm" });
        set({ pending: null }, false, "confirm");
        p?.onConfirm();
      },
      cancel: () => { if (get().pending) track("activity_switch_decided", { decision: "cancel" }); set({ pending: null }, false, "cancel"); },
    }),
    { name: "confirm-store" },
  ),
);

import { create } from "zustand";

const TOAST_MS = 2600;

interface ToastState {
  message: string | null;

  seq: number;
  show: (message: string) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>()((set, get) => ({
  message: null,
  seq: 0,
  show: (message) => {
    if (timer) clearTimeout(timer);
    set({ message, seq: get().seq + 1 });
    timer = setTimeout(() => set({ message: null }), TOAST_MS);
  },
  hide: () => {
    if (timer) clearTimeout(timer);
    set({ message: null });
  },
}));

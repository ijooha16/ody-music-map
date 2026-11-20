"use client";

import { useToastStore } from "@/stores/use-toast-store";

export default function Toast() {
  const message = useToastStore((s) => s.message);
  const seq = useToastStore((s) => s.seq);
  return (
    <div className="pointer-events-none absolute bottom-[86px] left-1/2 z-[30] -translate-x-1/2">
      {message && (
        <div key={seq} className="glass-liquid animate-tin rounded-pill! px-3.5 py-2 text-[14px] text-ink shadow-[0_8px_28px_-10px_#000]">
          {message}
        </div>
      )}
    </div>
  );
}

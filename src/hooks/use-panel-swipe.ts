"use client";

import { useCallback, useRef, type PointerEvent } from "react";
import { usePanelStore, type SheetSnap } from "@/stores/use-panel-store";

const DIST = 56;

const RATIO = 1.3;

const TAP_SLOP = 10;

const INTERACTIVE = "button, a, input, textarea, select, label, [role='button'], [contenteditable='true']";

export function usePanelSwipe() {
  const snap = usePanelStore((s) => s.snap);
  const setSnap = usePanelStore((s) => s.setSnap);
  const raiseSnap = usePanelStore((s) => s.raiseSnap);
  const start = useRef<{ x: number; y: number } | null>(null);

  const moved = useRef(false);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") return;

    if (!(e.target instanceof Node) || !e.currentTarget.contains(e.target)) {
      start.current = null;
      return;
    }
    start.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) moved.current = true;
      if (Math.abs(dy) < DIST || Math.abs(dy) < Math.abs(dx) * RATIO) return;

      const next = (dy < 0 ? snap + 1 : snap - 1) as SheetSnap;
      if (next < 1 || next > 3) {
        start.current = null;
        return;
      }

      if (dy > 0) {
        const scroller = (e.target as HTMLElement).closest<HTMLElement>(".scroll-quiet, [data-sheet-scroll]");
        if (scroller && scroller.scrollTop > 0) return;
      }
      start.current = null;
      setSnap(next);
    },
    [snap, setSnap],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const s = start.current;
      start.current = null;
      if (!s || moved.current || snap === 3) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > TAP_SLOP) return;
      if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
      raiseSnap();
    },
    [snap, raiseSnap],
  );

  const onPointerCancel = useCallback(() => {
    start.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}

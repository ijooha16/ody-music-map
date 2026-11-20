"use client";

import { useCallback, useRef, type PointerEvent } from "react";

const DIST = 48;

const RATIO = 1.3;

export function useSwipePager(onSwipe: (direction: number) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") return;
    start.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) < DIST || Math.abs(dx) < Math.abs(dy) * RATIO) return;

      start.current = null;
      onSwipe(dx < 0 ? 1 : -1);
    },
    [onSwipe],
  );

  const onPointerEnd = useCallback(() => {
    start.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd };
}

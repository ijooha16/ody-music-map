"use client";

import { useEffect, type RefObject } from "react";

const TAP_SLOP = 10;

export type DismissVerdict = false | true | "swallow";

export function useDismissOnOutside(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  enabled: boolean,
  counts?: (e: PointerEvent) => DismissVerdict,
): void {
  useEffect(() => {
    if (!enabled) return;

    const isOutside = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return false;
      if (e.target instanceof Node && el.contains(e.target)) return false;

      return counts ? counts(e) : true;
    };

    const swallowNextClick = () => {
      let timer = 0;
      const off = () => {
        document.removeEventListener("click", swallow, true);
        window.clearTimeout(timer);
      };
      const swallow = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        off();
      };
      document.addEventListener("click", swallow, true);

      timer = window.setTimeout(off, 700);
    };

    let press: { x: number; y: number; id: number } | null = null;

    const onPointerUp = (e: PointerEvent) => {
      const p = press;
      press = null;
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
      if (!p || p.id !== e.pointerId) return;

      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > TAP_SLOP) return;
      swallowNextClick();
      onDismiss();
    };

    const onCancel = () => {
      press = null;
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
    };

    const onPointerDown = (e: PointerEvent) => {
      const verdict = isOutside(e);
      if (!verdict) return;
      if (verdict === "swallow") {
        e.stopPropagation();
        e.preventDefault();
        swallowNextClick();
        onDismiss();
        return;
      }
      press = { x: e.clientX, y: e.clientY, id: e.pointerId };
      document.addEventListener("pointerup", onPointerUp, true);
      document.addEventListener("pointercancel", onCancel, true);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
    };
  }, [ref, onDismiss, enabled, counts]);
}

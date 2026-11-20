"use client";

import { useEffect, type RefObject } from "react";
import { SHEET_PEEK_TOP_PX } from "@/constants/design-tokens";
import { usePanelStore } from "@/stores/use-panel-store";

const PEEK_GAP = 14;

export function useSheetPeek(ref: RefObject<HTMLElement | null>, edge: "top" | "bottom") {
  useEffect(() => {
    const el = ref.current;
    const sheet = el?.closest<HTMLElement>("[data-sheet]");
    const body = el?.closest<HTMLElement>("[data-sheet-body]");
    if (!el || !sheet || !body) return;
    const setPeek = usePanelStore.getState().setSheetPeek;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const inBody = (edge === "bottom" ? r.bottom : r.top) - body.getBoundingClientRect().top - parseFloat(getComputedStyle(body).paddingTop);
      const px = Math.round(SHEET_PEEK_TOP_PX + inBody + (edge === "bottom" ? PEEK_GAP : 0));
      sheet.style.setProperty("--sheet-peek", `${px}px`);
      sheet.dataset.peek = "";
      setPeek(px);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      sheet.style.removeProperty("--sheet-peek");
      delete sheet.dataset.peek;
      setPeek(null);
    };
  }, [ref, edge]);
}

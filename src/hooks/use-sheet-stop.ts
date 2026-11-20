"use client";

import { useEffect, type RefObject } from "react";
import { SHEET_HEAD_PX } from "@/constants/design-tokens";
import { usePanelStore } from "@/stores/use-panel-store";

const STOP_GAP = 14;

export function useSheetStop(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    const sheet = el?.closest<HTMLElement>("[data-sheet]");
    const body = el?.closest<HTMLElement>("[data-sheet-body]");
    if (!el || !sheet || !body) return;
    const setStop = usePanelStore.getState().setSheetStop;

    const measure = () => {
      const inBody = el.getBoundingClientRect().bottom - body.getBoundingClientRect().top - parseFloat(getComputedStyle(body).paddingTop) + body.scrollTop;
      const px = Math.round(SHEET_HEAD_PX + inBody + STOP_GAP);
      sheet.style.setProperty("--sheet-stop", `${px}px`);
      sheet.dataset.stop = "";
      setStop(px);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      sheet.style.removeProperty("--sheet-stop");
      delete sheet.dataset.stop;
      setStop(null);
    };
  }, [ref]);
}

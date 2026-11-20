"use client";

import { useEffect, useState } from "react";

function useBarHeight(selector: string, fallback: number) {
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    const bar = document.querySelector(selector);
    if (!bar) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.round(entry.contentRect.height);

      if (h > 0) setHeight(h);
    });
    ro.observe(bar);
    return () => ro.disconnect();
  }, [selector]);

  return height;
}

export function usePlayerBarHeight() {
  return useBarHeight("footer[data-hud]", 80);
}

export function useTabBarHeight() {
  return useBarHeight("[data-tabbar]", 72);
}

export function useBrandBottom(fallback: number) {
  const [bottom, setBottom] = useState(fallback);

  useEffect(() => {
    const el = document.querySelector("[data-brand]");
    if (!el) return;
    const read = () => {
      const b = Math.round(el.getBoundingClientRect().bottom);
      if (b > 0) setBottom(b);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return bottom;
}

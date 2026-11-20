"use client";

import { useSyncExternalStore } from "react";
import { BREAKPOINTS } from "@/constants/design-tokens";

const QUERY = `(max-width: ${BREAKPOINTS.tablet - 1}px)`;

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);

  window.addEventListener("resize", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}

export function useIsNarrow() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

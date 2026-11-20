"use client";

import { FEATURES, PANEL_ENABLED } from "@/constants";

export function useFeatures(): typeof FEATURES {
  return FEATURES;
}

export function usePanelEnabled(): Record<string, boolean> {
  return PANEL_ENABLED;
}

"use client";

import { useEffect } from "react";
import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/api";

let done = false;

export function useForcePublic(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || done) return;
    done = true;
    void api(API_ENDPOINTS.user.publicVisibility, { method: "PATCH", body: JSON.stringify({ isPublic: true }) }).catch(() => {});
  }, [enabled]);
}

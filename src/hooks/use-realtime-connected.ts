"use client";

import { useSyncExternalStore } from "react";
import { isConnected, onConnectionChange } from "@/lib/realtime/stomp-client";

export function useRealtimeConnected(): boolean {
  return useSyncExternalStore(onConnectionChange, isConnected, () => false);
}

"use client";

import { useEffect } from "react";
import { STORAGE_KEYS } from "@/constants";
import { useFeatures } from "@/hooks/use-features";
import { connect, disconnect } from "@/lib/realtime/stomp-client";
import { readStorage, subscribeStorage } from "@/lib/storage";
import { usePresenceJoin } from "./use-presence-join";
import { useRideCaptain } from "./use-ride-captain";
import { useRideSession } from "./use-ride-session";
import { useReactionLive } from "./use-reaction-live";

export function useRealtime(): void {
  const features = useFeatures();
  const social = features.social;

  useEffect(() => {
    if (!social) return;
    connect();

    const stop = subscribeStorage(() => {
      if (readStorage<string>(STORAGE_KEYS.accessToken)) connect();
      else void disconnect();
    });
    return () => {
      stop();
      void disconnect();
    };
  }, [social]);

  usePresenceJoin();

  useRideSession();
  useRideCaptain();

  useReactionLive();
}

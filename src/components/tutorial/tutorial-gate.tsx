"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import { useMeQuery } from "@/hooks/queries/use-me-query";
import { readStorage } from "@/lib/storage";
import { useTutorialStore } from "@/stores/use-tutorial-store";
import { setAnalyticsContext, trackOnce } from "@/lib/analytics/client";

export default function TutorialGate() {
  const router = useRouter();
  const { data: me, isPending } = useMeQuery();

  useEffect(() => {
    if (useTutorialStore.getState().hydrateCompletion(me?.tutorialCompleted)) {
      setAnalyticsContext({ phase: "free" });
      trackOnce("free-explore", "free_explore_started");
      return;
    }

    if (isPending) return;
    const saved = readStorage<number>(STORAGE_KEYS.myMusicId);
    if (saved == null) router.replace(ROUTES.tutorial);
    else {
      setAnalyticsContext({ phase: "free" });
      trackOnce("free-explore", "free_explore_started");
    }
  }, [me, isPending, router]);

  return null;
}

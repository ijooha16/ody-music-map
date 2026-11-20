"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { ROUTES, STORAGE_KEYS, TUTORIAL_STEPS } from "@/constants";
import { useCompleteTutorialMutation } from "@/hooks/mutations/use-complete-tutorial-mutation";
import { removeStorage } from "@/lib/storage";
import { useJourneyStore } from "@/stores/use-journey-store";
import { useMapStore } from "@/stores/use-map-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { useTutorialStore } from "@/stores/use-tutorial-store";
import { StarHint, WheelHint } from "./tutorial-hint";
import TutorialSpotlight from "./tutorial-spotlight";
import TutorialOutro from "./tutorial-outro";
import TutorialStepCard from "./tutorial-step-card";
import { analyticsId, setAnalyticsContext, trackOnce } from "@/lib/analytics/client";

const CARD_BOTTOM = 330;

const ZOOM_STEP_RATIO = 3;

const ZOOM_EXPLORE_MS = 5000;

const CARD_AT = {
  top: "top-[120px] left-1/2 -translate-x-1/2",

  left: "top-[120px] left-[24px]",

  right: "top-[76px] right-[90px]",
  bottom: "bottom-[92px] left-1/2 -translate-x-1/2",
} as const;

export default function TutorialOverlay() {
  const stepIndex = useTutorialStore((s) => s.stepIndex);
  const isDone = useTutorialStore((s) => s.isDone);
  const complete = useTutorialStore((s) => s.complete);
  const skip = useTutorialStore((s) => s.skip);
  const reset = useTutorialStore((s) => s.reset);
  const { mutate: completeTutorial } = useCompleteTutorialMutation();

  const [starId, setStarId] = useState<number | null>(null);
  const analyticsRun = useRef<string | null>(null);

  useEffect(() => {
    analyticsRun.current ??= analyticsId();
    setAnalyticsContext({ phase: "tutorial" });
    trackOnce(`tutorial:${analyticsRun.current}`, "tutorial_started", { tutorial_id: analyticsRun.current });
    trackOnce(`tutorial-step:${analyticsRun.current}`, "tutorial_step_viewed", { step: 0, task: TUTORIAL_STEPS[0].task });
    reset();
  }, [reset]);

  const finish = useCallback(() => {
    removeStorage(STORAGE_KEYS.myMusicId);
    removeStorage(STORAGE_KEYS.myHome);
    removeStorage(STORAGE_KEYS.playingMusicId);
    useTutorialStore.getState().finish();

    completeTutorial();
    window.location.replace(ROUTES.home);
  }, [completeTutorial]);

  const skipTutorial = () => {
    skip();
    finish();
  };

  const startMusicId = useJourneyStore((s) => s.startMusicId);
  const endMusicId = useJourneyStore((s) => s.endMusicId);

  const composerOpen = useJourneyStore((s) => s.isComposerOpen);
  const activePanel = usePanelStore((s) => s.activePanel);
  useEffect(() => {
    if (composerOpen || activePanel === "journey") complete("look");
    if (startMusicId != null) complete("journey-start");
    if (endMusicId != null) complete("journey-end");
  }, [composerOpen, activePanel, startMusicId, endMusicId, stepIndex, complete]);

  const step = TUTORIAL_STEPS[stepIndex];
  const needsStar = step?.hint === "star";

  const zooming = step?.task === "zoom";
  const [wheeled, setWheeled] = useState(false);
  useEffect(() => {
    if (!zooming) return;
    const layer0 = useMapStore.getState().layer;

    let k0 = 0;
    let firstWheelAt = 0;
    const onWheel = () => {
      if (!firstWheelAt) firstWheelAt = Date.now();
      setWheeled(true);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    const id = window.setInterval(() => {
      const e = getMapEngine();
      if (!e) return;
      if (!k0) return void (k0 = e.zoomK());

      if ((e.pressure > 0 && e.pressureDir === 1) || useMapStore.getState().layer !== layer0) return void complete("zoom");
      if (!firstWheelAt || Date.now() - firstWheelAt < ZOOM_EXPLORE_MS) return;
      if (e.zoomK() >= k0 * ZOOM_STEP_RATIO) complete("zoom");
    }, 120);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("wheel", onWheel);
    };
  }, [zooming, complete]);

  useEffect(() => {
    if (!needsStar) return;
    let cur: number | null = null;
    const id = window.setInterval(() => {
      const e = getMapEngine();
      if (!e || (cur != null && e.starPos(cur))) return;
      cur = e.pickTutorialStar(CARD_BOTTOM);
      setStarId(cur);
    }, 300);
    return () => window.clearInterval(id);
  }, [needsStar, stepIndex]);

  const pickStar = () => {
    if (starId == null) return;
    useMapStore.getState().selectMusic(starId);
    usePanelStore.getState().openSong(starId);
    getMapEngine()?.viewSong(starId);
    complete("select");
  };

  if (isDone) return <TutorialOutro onStart={finish} />;
  if (!step) return null;

  return (
    <>

      <div className="pointer-events-none absolute inset-0 z-[19]">
        {step.hint === "wheel" && !wheeled && <WheelHint />}
        {step.hint === "star" && starId != null && <StarHint musicId={starId} onPick={pickStar} />}
      </div>

      {step.veil && !(zooming && wheeled) && (
        <div className="pointer-events-none absolute inset-0 z-[60] max-tablet:z-[19]">
          <TutorialSpotlight spotlight={step.spotlight} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-[60] max-tablet:z-[19]">
        <div className={`pointer-events-auto absolute w-[min(340px,84vw)] ${CARD_AT[step.card]}`}>
          <TutorialStepCard
            index={stepIndex}
            total={TUTORIAL_STEPS.length}
            title={step.title}
            description={step.description}

            cta={step.cta || undefined}
            onConfirm={step.cta ? () => complete(step.task) : undefined}
            onSkip={skipTutorial}
          />
        </div>
      </div>
    </>
  );
}

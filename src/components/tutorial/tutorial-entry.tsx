"use client";

import { useState, useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/constants";
import { useSurveyMode } from "@/hooks/use-survey-mode";
import { readStorage, writeStorage } from "@/lib/storage";
import TestGuide from "./test-guide";
import TutorialOverlay from "./tutorial-overlay";
import { track } from "@/lib/analytics/client";

export default function TutorialEntry() {
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  const surveyMode = useSurveyMode();
  const [started, setStarted] = useState(false);

  const seen = hydrated
    ? started || !surveyMode || readStorage<boolean>(STORAGE_KEYS.testGuideSeen) === true
    : null;

  if (seen === null) return null;
  if (!seen) {
    return (
      <TestGuide
        onStart={() => {
          track("test_guide_accepted");
          writeStorage(STORAGE_KEYS.testGuideSeen, true);
          setStarted(true);
        }}
      />
    );
  }
  return <TutorialOverlay />;
}

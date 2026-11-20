"use client";

import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/constants";

import { TEST_TOOLS } from "@/constants/test-tools";
import { readStorage } from "@/lib/storage";

const noopSubscribe = () => () => {};

export function surveyModeEnabled(): boolean {
  return TEST_TOOLS && readStorage<boolean>(STORAGE_KEYS.surveyMode) === true;
}

export function useSurveyMode(): boolean {
  return useSyncExternalStore(noopSubscribe, surveyModeEnabled, () => false);
}

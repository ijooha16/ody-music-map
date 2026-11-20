"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants";
import { useSurveyMode } from "@/hooks/use-survey-mode";

const SurveyRunner = dynamic(() => import("./survey-runner"), { ssr: false });

export default function SurveyGate() {
  const pathname = usePathname();

  const surveyMode = useSurveyMode();

  if (!surveyMode) return null;

  if (pathname !== ROUTES.home) return null;

  return <SurveyRunner />;
}

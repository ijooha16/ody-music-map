"use client";

import { useRef } from "react";
import { useIsNarrow } from "@/hooks/use-is-narrow";
import { useSheetPeek } from "@/hooks/use-sheet-peek";
import { useSheetStop } from "@/hooks/use-sheet-stop";
import type { JourneyRoute } from "@/types";
import JourneyEndpoints from "./journey-endpoints";
import JourneySummary from "./journey-summary";

export default function JourneyTop({ route }: { route: JourneyRoute }) {
  const narrow = useIsNarrow();
  const topRef = useRef<HTMLDivElement>(null);
  useSheetPeek(topRef, "bottom");
  useSheetStop(topRef);

  return (
    <div ref={topRef} className="flex flex-col gap-3">
      <JourneyEndpoints />
      {narrow && <JourneySummary route={route} />}
    </div>
  );
}

"use client";

import { useOpenJourneyComposer } from "@/hooks/use-open-journey-composer";
import { useJourneyStore } from "@/stores/use-journey-store";
import JourneyEndpointField from "./journey-endpoint-field";

export default function JourneyEndpoints() {
  const startMusicId = useJourneyStore((s) => s.startMusicId);
  const endMusicId = useJourneyStore((s) => s.endMusicId);
  const openComposer = useOpenJourneyComposer();

  return (
    <div className="flex flex-col gap-0.5 rounded-box-sm bg-white/[.025] px-3 py-2">
      <JourneyEndpointField label="출발" tone="teal" musicId={startMusicId} onOpenComposer={() => openComposer("start")} />
      <JourneyEndpointField label="도착" tone="violet" musicId={endMusicId} onOpenComposer={() => openComposer("end")} />
    </div>
  );
}

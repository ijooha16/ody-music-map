"use client";

import { usePathname } from "next/navigation";
import { JourneyIcon } from "@/components/common/icons";
import { ROUTES } from "@/constants";
import { RIDING_JOURNEY_BLOCKED } from "@/constants";
import { usePanelEnabled } from "@/hooks/use-features";
import { useOpenJourneyComposer } from "@/hooks/use-open-journey-composer";
import { useFollowStore } from "@/stores/use-follow-store";
import { useJourneyStore } from "@/stores/use-journey-store";
import { usePanelStore } from "@/stores/use-panel-store";
import NearbyExploreButton from "./nearby-explore-button";
import RailButton from "./rail-button";

export default function MapActions() {
  const pathname = usePathname();
  const panelEnabled = usePanelEnabled();
  const toggle = usePanelStore((s) => s.toggle);
  const hasJourney = useJourneyStore((s) => s.isRouteRequested);
  const composerOpen = useJourneyStore((s) => s.isComposerOpen);
  const closeComposer = useJourneyStore((s) => s.closeComposer);
  const openComposer = useOpenJourneyComposer();
  const riding = useFollowStore((s) => s.leaderEmail != null);

  if (pathname !== ROUTES.home) return null;

  const pressJourney = () => {
    if (composerOpen) closeComposer();
    else if (hasJourney) toggle("journey", 1);
    else openComposer();
  };

  return (
    <div
      data-hud

      data-map-actions
      className="absolute top-hud-t right-gutter-sm z-[22] hidden h-8 items-center gap-3 transition-opacity duration-300 max-tablet:flex"
    >
      <NearbyExploreButton bare sheetSnap={1} />
      {panelEnabled.journey && (
        <RailButton
          label="여정"
          active={composerOpen}
          disabled={riding}
          title={riding ? RIDING_JOURNEY_BLOCKED : "여정"}
          onClick={pressJourney}
          data-tutorial="journey"
          bare
        >
          <JourneyIcon size={17} />
        </RailButton>
      )}

    </div>
  );
}

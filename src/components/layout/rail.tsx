"use client";

import { FriendsIcon, JourneyIcon, RankIcon } from "@/components/common/icons";
import { RIDING_JOURNEY_BLOCKED } from "@/constants";
import { useFeatures, usePanelEnabled } from "@/hooks/use-features";
import { useOpenJourneyComposer } from "@/hooks/use-open-journey-composer";
import { useFollowStore } from "@/stores/use-follow-store";
import { useJourneyStore } from "@/stores/use-journey-store";
import { usePanelStore } from "@/stores/use-panel-store";
import ContestButton from "./contest-button";
import NearbyExploreButton from "./nearby-explore-button";
import ProfileButton from "./profile-button";
import RailButton from "./rail-button";

export default function Rail() {
  const activePanel = usePanelStore((s) => s.activePanel);
  const toggle = usePanelStore((s) => s.toggle);

  const hasJourney = useJourneyStore((s) => s.isRouteRequested);
  const composerOpen = useJourneyStore((s) => s.isComposerOpen);
  const closeComposer = useJourneyStore((s) => s.closeComposer);
  const openComposer = useOpenJourneyComposer();
  const pressJourney = () => {
    if (composerOpen) closeComposer();
    else if (hasJourney) toggle("journey");
    else openComposer();
  };
  const panelEnabled = usePanelEnabled();
  const features = useFeatures();

  const riding = useFollowStore((s) => s.leaderEmail != null);

  return (
    <div data-hud className="absolute top-hud-t right-[18px] z-[22] flex items-center gap-2 max-tablet:hidden">

      {features.contest && <ContestButton />}
      <nav aria-label="네비" className="glass-liquid flex gap-0.5 rounded-pill! p-px">
        {panelEnabled.friends && (
          <RailButton label="주변 사람" active={activePanel === "friends"} onClick={() => toggle("friends")} data-tutorial="friends">
            <FriendsIcon />
          </RailButton>
        )}
        {panelEnabled.chart && (
          <RailButton label="랭킹" active={activePanel === "chart"} onClick={() => toggle("chart")} data-tutorial="chart">
            <RankIcon />
          </RailButton>
        )}
        <NearbyExploreButton />
        {panelEnabled.journey && (
          <RailButton
            label="여정"
            active={composerOpen || activePanel === "journey"}
            disabled={riding}
            title={riding ? RIDING_JOURNEY_BLOCKED : "여정"}
            onClick={pressJourney}
            data-tutorial="journey"
          >
            <JourneyIcon size={17} />
          </RailButton>
        )}
      </nav>

      {panelEnabled.feed && <ProfileButton />}
    </div>
  );
}

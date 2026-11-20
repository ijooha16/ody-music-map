"use client";

import { useEffect } from "react";
import Box from "@/components/common/box";
import { NO_GENRE_ID } from "@/constants";
import { useJourneyRouteQuery } from "@/hooks/queries/use-journey-route-query";
import { useIsNarrow } from "@/hooks/use-is-narrow";
import { useJourneyStore } from "@/stores/use-journey-store";
import { useMapStore } from "@/stores/use-map-store";
import PanelBackButton from "../panel-back-button";
import PanelCloseButton from "../panel-close-button";
import JourneyEmptyPrompt from "./journey-empty-prompt";
import JourneySkeleton from "./journey-skeleton";
import JourneyStopList from "./journey-stop-list";
import JourneySummary from "./journey-summary";
import JourneyTop from "./journey-top";
import { analyticsContext, trackOnce } from "@/lib/analytics/client";
import { journeyResult } from "@/lib/analytics/flows";

export default function JourneyPanel() {
  const startMusicId = useJourneyStore((s) => s.startMusicId);
  const endMusicId = useJourneyStore((s) => s.endMusicId);
  const isRouteRequested = useJourneyStore((s) => s.isRouteRequested);
  const route = useJourneyRouteQuery(startMusicId, endMusicId, isRouteRequested);
  const showConstellation = useMapStore((s) => s.showConstellation);

  const stops = route.data?.stops;
  const routeStart = route.data?.startMusicId;
  const routeEnd = route.data?.endMusicId;
  useEffect(() => {
    if (!isRouteRequested || startMusicId == null || endMusicId == null) return;
    if (route.isError) journeyResult(startMusicId, endMusicId, "error", 0);
    if (!route.data) return;
    const count = route.data.stops.length;
    journeyResult(startMusicId, endMusicId, count ? "success" : "empty", count);
    trackOnce(`journey-results:${analyticsContext().journey_id ?? `${startMusicId}-${endMusicId}`}`, "journey_results_viewed", {
      start_music_id: startMusicId, end_music_id: endMusicId, result_count: count,
    });
  }, [isRouteRequested, startMusicId, endMusicId, route.data, route.isError]);
  useEffect(() => {
    if (!stops || stops.length < 2 || routeStart == null || routeEnd == null) return;

    showConstellation(
      stops.map((s) => s.id),
      stops.map((s) => ({ musicId: s.id, pc: s.pc, genreId: NO_GENRE_ID, weight: 1, title: s.title, artist: s.artist, youtubeUrl: null, playable: true })),

      { kind: "journey", startMusicId: routeStart, endMusicId: routeEnd },
    );
  }, [stops, routeStart, routeEnd, showConstellation]);

  const hasRoute = isRouteRequested && !!route.data;

  const narrow = useIsNarrow();

  return (
    <Box lead={<PanelBackButton />} title="여정" actions={<PanelCloseButton />} footer={narrow ? undefined : <JourneySummary route={route.data ?? null} />}>
      {!isRouteRequested && <JourneyEmptyPrompt />}
      {isRouteRequested && route.isPending && <JourneySkeleton />}
      {hasRoute && route.data && (
        <>
          <JourneyTop route={route.data} />
          <JourneyStopList route={route.data} />
        </>
      )}
    </Box>
  );
}

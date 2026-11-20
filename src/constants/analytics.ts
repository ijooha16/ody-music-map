export const ANALYTICS = {
  checkpointMs: 120_000,
  searchSettleMs: 500,
  wheelSettleMs: 300,
  qualifiedMs: 20_000,
  startTimeoutMs: 15_000,
  queueLimit: 100,
  schemaVersion: 1,
} as const;

export const POSTHOG_CORE_EVENTS = new Set([
  "page_view", "page_leave", "free_explore_started", "tutorial_started", "tutorial_finished",
  "nearby_opened", "nearby_closed", "nearby_results_viewed",
  "journey_create_requested", "journey_create_result", "journey_results_viewed",
  "play_requested", "play_started", "play_qualified", "play_ended", "playback_issue",
  "engagement_recorded", "feature_request_failed",
]);

const DEPLOYED_WS_ORIGIN = "wss://j15a405.p.ssafy.io";

export function wsOrigin(): string {
  return process.env.NEXT_PUBLIC_WS_ORIGIN || DEPLOYED_WS_ORIGIN;
}

export const REALTIME = {
  ws: { path: "/ws/websocket" },

  queue: { presence: "/user/queue/presence", errors: "/user/queue/errors" },
  send: {
    join: "/app/presence/join",
    heartbeat: "/app/presence/heartbeat",
    leave: "/app/presence/leave",
    viewport: "/app/presence/viewport",
    viewportClose: "/app/presence/viewport/close",
    nearbyClose: "/app/nearby/close",

    ridePlayback: "/app/ride/playback",
    ridePanel: "/app/ride/panel",

    rideView: "/app/ride/view",
  },

  rideSeekThrottleMs: 500,

  rideTrackTitleWaitMs: 1500,

  rideDriftCheckMs: 5000,

  rideDriftToleranceMs: 2000,

  rideSeekMinGapMs: 500,

  maxRiders: 20,

  heartbeatMs: 15_000,

  viewportDebounceMs: 250,

  requestTimeoutMs: 3_000,

  reconnectDelayMs: 3_000,
} as const;

export const LAYER_USERS = {
  pollMs: 10_000,

  neighborK: 80,

  maxInPanel: 12,
} as const;

export const RADAR = {
  size: 300,

  ringMin: 0.58,

  ringMax: 0.82,

  sizeMin: 38,
  sizeMax: 50,

  breatheFrom: 0.6,
} as const;

export const RIDE_RESUME = {
  backoffMs: [3_000, 5_000, 8_000, 12_000, 17_000],

  finalCodes: ["RIDE_SELF", "RIDE_CHAIN_FORBIDDEN", "RIDE_NOT_CAPTAIN", "RIDE_FULL"],
} as const;

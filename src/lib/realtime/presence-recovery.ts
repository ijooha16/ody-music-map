import type { WebSocketErrorCode } from "@/types";

export type PresenceRecovery = "reconnect" | "rejoin" | "none";

export function recoveryFor(code: WebSocketErrorCode): PresenceRecovery {
  switch (code) {
    case "PRESENCE_NOT_CONNECTED":
      return "reconnect";
    case "PRESENCE_STALE":
      return "rejoin";
    default:
      return "none";
  }
}

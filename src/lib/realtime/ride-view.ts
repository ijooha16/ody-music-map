import type { MapViewMode } from "@/constants";
import type { PlayContext } from "@/stores/use-player-store";
import type { RideViewRequest } from "@/types";

export function rideViewOf(s: { viewMode: MapViewMode; constellationSource: PlayContext | null; nearbyCenterMusicId: number | null }): RideViewRequest {
  if (s.viewMode === "nearby" && s.nearbyCenterMusicId != null) return { kind: "nearby", centerMusicId: s.nearbyCenterMusicId };
  if (s.viewMode === "constellation" && s.constellationSource) {
    const src = s.constellationSource;
    if (src.kind === "journey") return { kind: "journey", startMusicId: src.startMusicId, endMusicId: src.endMusicId };
    if (src.kind === "playlist") return { kind: "playlist", playlistId: src.playlistId };
  }
  return { kind: "default" };
}

export function sameRideView(a: RideViewRequest, b: RideViewRequest): boolean {
  return a.kind === b.kind && a.startMusicId === b.startMusicId && a.endMusicId === b.endMusicId && a.playlistId === b.playlistId && a.centerMusicId === b.centerMusicId;
}

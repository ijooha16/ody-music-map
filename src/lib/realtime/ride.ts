"use client";

import { REALTIME } from "@/constants";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { getPlayer } from "@/components/player/player-registry";
import { sendJoinNow } from "@/hooks/use-presence-join";
import { adjustRiderCount, pushViewport } from "@/hooks/use-viewport-subscription";
import { subscribePlayback } from "@/lib/playback-events";
import { send } from "@/lib/realtime/stomp-client";
import { useFollowStore } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import { usePlayerStore } from "@/stores/use-player-store";
import type { RidePanelTab, RidePlaybackEvent, RidePlaybackState, RideViewRequest } from "@/types";

const toMs = (sec: number) => Math.max(0, Math.round(sec * 1000));

export function currentPositionMs(): number {
  const p = getPlayer();
  if (!p) return 0;
  const t = p.getCurrentTime();
  return Number.isFinite(t) ? toMs(t) : 0;
}

const MAX_LATENCY_MS = 10_000;

export function positionNow(positionMs: number, state: RidePlaybackState, serverTs: number): number {
  if (state !== "PLAYING") return Math.max(0, positionMs);
  const elapsed = Math.min(Math.max(0, Date.now() - serverTs), MAX_LATENCY_MS);
  return Math.max(0, positionMs) + elapsed;
}

export function playFrom(musicId: number, positionMs: number, shouldPlay: boolean, receivedAt: number = Date.now()): void {
  anchor = { musicId, positionMs: Math.max(0, positionMs), playing: shouldPlay, localAt: receivedAt };
  usePlayerStore.getState().playSingle(musicId);
  seekWhenReady(musicId, shouldPlay);
}

export function syncPlayback(positionMs: number, state: RidePlaybackState): void {
  const player = usePlayerStore.getState();
  const shouldPlay = state === "PLAYING";
  if (anchor) anchor = { ...anchor, positionMs: Math.max(0, positionMs), playing: shouldPlay, localAt: Date.now() };
  const p = getPlayer();
  if (p) p.seekTo(positionMs / 1000, true);
  if (shouldPlay && !player.isPlaying) player.toggle();
  else if (!shouldPlay && player.isPlaying) player.pause();
}

export interface RideAnchor {
  musicId: number;
  positionMs: number;
  playing: boolean;
  localAt: number;
}

let anchor: RideAnchor | null = null;

export function anchorPositionAt(a: RideAnchor, now: number): number {
  return a.playing ? a.positionMs + Math.max(0, now - a.localAt) : a.positionMs;
}

export function driftTarget(actualMs: number, expectedMs: number, durationMs: number): number | null {
  const tolerance = REALTIME.rideDriftToleranceMs;
  if (durationMs > 0 && expectedMs >= durationMs - tolerance) return null;
  return Math.abs(actualMs - expectedMs) > tolerance ? expectedMs : null;
}

export function correctDrift(): void {
  const a = anchor;
  if (!a || !a.playing || pendingSeek) return;
  if (!useFollowStore.getState().leaderEmail) return;
  const player = usePlayerStore.getState();
  if (!player.isPlaying || player.currentMusicId !== a.musicId) return;
  const p = getPlayer();
  if (!p) return;
  const duration = p.getDuration();
  const target = driftTarget(currentPositionMs(), anchorPositionAt(a, Date.now()), Number.isFinite(duration) ? toMs(duration) : 0);
  if (target != null) p.seekTo(target / 1000, true);
}

let pendingSeek: { musicId: number; shouldPlay: boolean } | null = null;
let unsubscribePlayback: (() => void) | null = null;

function seekWhenReady(musicId: number, shouldPlay: boolean): void {
  pendingSeek = { musicId, shouldPlay };
  if (unsubscribePlayback) return;
  unsubscribePlayback = subscribePlayback((event) => {
    const want = pendingSeek;
    if (!want || event.musicId !== want.musicId || event.state !== "playing") return;
    pendingSeek = null;
    const p = getPlayer();
    const a = anchor;
    const target = a && a.musicId === want.musicId ? anchorPositionAt(a, Date.now()) : 0;
    if (p && Math.abs(target - currentPositionMs()) > REALTIME.rideSeekMinGapMs) p.seekTo(target / 1000, true);
    if (!want.shouldPlay) usePlayerStore.getState().pause();
  });
}

export function cancelPendingSeek(): void {
  pendingSeek = null;
  anchor = null;
  unsubscribePlayback?.();
  unsubscribePlayback = null;
}

export function leaveRideLocally(): void {
  cancelPendingSeek();
  const leader = useFollowStore.getState().leaderEmail;
  useFollowStore.getState().stop();
  getMapEngine()?.stopFollow();

  if (leader) adjustRiderCount(leader, -1);
}

export function endRide(at: { musicId: number | null; layer: number }): void {
  leaveRideLocally();

  if (at.musicId != null) {
    useMapStore.getState().setMyMusicId(at.musicId);

    getMapEngine()?.settleAfterRide(at.musicId);
  }

  const map = useMapStore.getState();
  if (at.layer < map.layer) map.surfaceTo(at.layer);

  if (map.viewMode === "nearby") map.exitNearby();
  else if (map.viewMode === "constellation") map.clearConstellation();

  sendJoinNow(at.layer);
  pushViewport();
}

export function publishPlayback(event: RidePlaybackEvent, positionMs: number): void {
  if (useFollowStore.getState().leaderEmail) return;
  send(REALTIME.send.ridePlayback, { event, positionMs: Math.max(0, Math.round(positionMs)) });
}

let seekTimer: ReturnType<typeof setTimeout> | null = null;
let seekLastAt = 0;
let seekPending: number | null = null;

export function publishSeek(positionMs: number): void {
  const now = Date.now();
  const since = now - seekLastAt;
  if (since >= REALTIME.rideSeekThrottleMs) {
    seekLastAt = now;
    publishPlayback("SEEK", positionMs);
    return;
  }
  seekPending = positionMs;
  if (seekTimer) return;
  seekTimer = setTimeout(() => {
    seekTimer = null;
    if (seekPending == null) return;
    seekLastAt = Date.now();
    publishPlayback("SEEK", seekPending);
    seekPending = null;
  }, REALTIME.rideSeekThrottleMs - since);
}

export function publishView(view: RideViewRequest): void {
  if (useFollowStore.getState().leaderEmail) return;
  send(REALTIME.send.rideView, view);
}

export function publishPanel(open: boolean, musicId?: number, tab: RidePanelTab = "info"): void {
  if (useFollowStore.getState().leaderEmail) return;

  if (open && musicId == null) return;
  send(REALTIME.send.ridePanel, open ? { open, musicId, tab } : { open: false });
}

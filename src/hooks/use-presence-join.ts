"use client";

import { useEffect } from "react";
import { REALTIME, STORAGE_KEYS } from "@/constants";
import { readStorage } from "@/lib/storage";
import { recoveryFor } from "@/lib/realtime/presence-recovery";
import { expect, onConnectionChange, onType, reconnect, send, settle } from "@/lib/realtime/stomp-client";
import { isRiding } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import type { PresenceErrorPayload, PresenceJoined } from "@/types";

let joinSeq = 0;

let lastLayer = 0;

const JOIN_KEY = "presence/join";

const joinWaiters = new Set<() => void>();

function releaseJoinWaiters(): void {
  for (const done of [...joinWaiters]) done();
}

function anchorMusicId(): number {
  const playing = readStorage<number>(STORAGE_KEYS.playingMusicId);
  return playing ?? useMapStore.getState().myMusicId ?? 1;
}

export function sendJoinNow(layer?: number): void {
  if (isRiding()) return;
  const at = layer ?? useMapStore.getState().layer;
  lastLayer = at;
  joinSeq += 1;
  const ok = send(REALTIME.send.join, { requestSeq: joinSeq, layer: at, musicId: anchorMusicId() });

  if (ok) expect(JOIN_KEY, () => sendJoinNow(at));
}

export function joinAndWait(layer?: number): Promise<void> {
  if (isRiding()) return Promise.resolve();
  sendJoinNow(layer);
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      joinWaiters.delete(done);
      resolve();
    };
    const timer = setTimeout(done, REALTIME.requestTimeoutMs);
    joinWaiters.add(done);
  });
}

export function usePresenceJoin(): void {
  const layer = useMapStore((s) => s.layer);

  useEffect(() => {
    sendJoinNow(layer);
  }, [layer]);

  useEffect(() => onConnectionChange((up) => up && sendJoinNow(lastLayer)), []);

  useEffect(() => {
    const stop = onType<PresenceJoined>(["PRESENCE_JOINED"], (p) => {
      settle(JOIN_KEY);
      releaseJoinWaiters();

      useMapStore.getState().setMyMusicId(p.musicId);
    });
    const stopErr = onType<PresenceErrorPayload>(["PRESENCE_ERROR"], (p) => {
      settle(JOIN_KEY);
      releaseJoinWaiters();

      if (p.code === "PRESENCE_NO_ANCHOR") useMapStore.getState().setMyMusicId(null);

      const recovery = recoveryFor(p.code);
      if (recovery === "reconnect") void reconnect();
      if (recovery === "rejoin") sendJoinNow(lastLayer);
    });
    return () => {
      stop();
      stopErr();
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => send(REALTIME.send.heartbeat), REALTIME.heartbeatMs);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;

      send(REALTIME.send.heartbeat);
      sendJoinNow(lastLayer);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    const onHide = () => send(REALTIME.send.leave);
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);
}

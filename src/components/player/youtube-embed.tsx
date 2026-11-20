"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PLAYBACK_BLOCKED, SKIPPED_UNPLAYABLE } from "@/constants";
import { usePlayability, useVideoIdQuery } from "@/hooks/queries/use-video-id-query";
import { logVideoId } from "@/lib/live-log";
import { playingAction, reportPlayback } from "@/lib/playback-events";
import { useBlockingStore } from "@/stores/use-blocking-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { useToastStore } from "@/stores/use-toast-store";
import { registerPlayer, type PlayerHandle } from "./player-registry";

const UNSTARTED = -1;
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const CUED = 5;

const REPLAY_TRIES = 3;

const CACHE_HIT_MS = 1000;

const CONTEXT_LABEL: Record<string, string> = { single: "단독", playlist: "플리", journey: "여정", nearby: "주변 탐색" };

interface YtPlayer extends PlayerHandle {
  loadVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  getPlayerState: () => number;
  getVideoUrl: () => string;
  destroy: () => void;
}

function readyPlayer(value: YtPlayer | null): value is YtPlayer {
  if (!value) return false;
  const player = value as unknown as Record<string, unknown>;
  return ["loadVideoById", "playVideo", "pauseVideo", "stopVideo", "getPlayerState", "getVideoUrl",
    "getCurrentTime", "getDuration", "seekTo", "destroy"].every((key) => typeof player[key] === "function");
}

function currentVideoId(player: YtPlayer): string | null {
  try { return new URL(player.getVideoUrl()).searchParams.get("v"); }
  catch { return null; }
}

interface YtNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId?: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onError?: (e: { data: number }) => void;
      };
    },
  ) => YtPlayer;
}

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReady: Promise<void> | null = null;
function loadIframeApi(): Promise<void> {
  if (apiReady) return apiReady;
  apiReady = new Promise<void>((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiReady;
}

export default function YoutubeEmbed() {
  const currentMusicId = usePlayerStore((s) => s.currentMusicId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const { status, data, error, dataUpdatedAt } = useVideoIdQuery(currentMusicId);
  const videoId = data?.videoId ?? null;
  const playSeq = usePlayerStore((s) => s.playSeq);

  const { blocked } = usePlayability(currentMusicId);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    if (currentMusicId == null) return;
    const p = usePlayerStore.getState();
    const label = CONTEXT_LABEL[p.context.kind] ?? p.context.kind;
    logVideoId(currentMusicId, {
      status,
      lookup: data?.lookup ?? "unsearched",
      videoId: data?.videoId ?? null,
      error: error as { code?: string; message?: string } | null,
      fromCache: Date.now() - dataUpdatedAt > CACHE_HIT_MS,
      where: p.queue.length ? `${label} ${p.queueIndex + 1}/${p.queue.length}` : label,
    });
  }, [currentMusicId, status, data, error, dataUpdatedAt]);

  useEffect(() => {
    if (!isPlaying || blocked !== PLAYBACK_BLOCKED.noVideo) return;
    const p = usePlayerStore.getState();
    if (p.currentMusicId !== currentMusicId || p.playSeq !== playSeq || currentMusicId == null) return;
    reportPlayback({ musicId: currentMusicId, playSeq, state: "unavailable", at: Date.now() });

    if (p.queue.length === 0) { p.pause(); return; }

    const before = p.currentMusicId;

    p.next();
    const after = usePlayerStore.getState();
    if (after.currentMusicId === before) {
      return;
    }
    showToast(SKIPPED_UNPLAYABLE);
  }, [currentMusicId, playSeq, blocked, isPlaying, showToast]);

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const loadedIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  const wantPlayRef = useRef(0);

  const loadedSeqRef = useRef(-1);
  const loadedMusicRef = useRef<number | null>(null);
  const endedSeqRef = useRef<number | null>(null);
  const startedSeqRef = useRef<number | null>(null);

  const onStateChange = useCallback((e: { data: number }) => {
    const p = usePlayerStore.getState();
    const player = playerRef.current;

    if (!readyPlayer(player) || p.currentMusicId == null || loadedMusicRef.current !== p.currentMusicId || loadedSeqRef.current !== p.playSeq
      || currentVideoId(player) !== loadedIdRef.current) return;
    if (player.getPlayerState() !== e.data) return;
    const report = (state: "playing" | "paused" | "ended") => reportPlayback({ musicId: p.currentMusicId!, playSeq: p.playSeq, state, at: Date.now() });
    if (e.data === PLAYING) {
      wantPlayRef.current = 0;

      const action = playingAction(p.isPlaying, useBlockingStore.getState().busy);
      if (action === "stop") { player.pauseVideo(); return; }
      if (action === "silent") return;
      startedSeqRef.current = p.playSeq;
      endedSeqRef.current = null;
      report("playing");
      return;
    }
    report(e.data === ENDED ? "ended" : "paused");
    if (e.data === ENDED) {
      if (startedSeqRef.current !== p.playSeq || endedSeqRef.current === p.playSeq || useBlockingStore.getState().busy) return;
      endedSeqRef.current = p.playSeq;
      wantPlayRef.current = 0;
      p.next();
      return;
    }
    if (e.data === UNSTARTED || e.data === CUED || e.data === PAUSED) {
      if (wantPlayRef.current > 0 && p.isPlaying) {
        wantPlayRef.current -= 1;
        player.playVideo();
        return;
      }
      if (e.data === PAUSED && p.isPlaying) p.pause();
    }
  }, []);

  const onError = useCallback((e: { data: number }) => {
    const p = usePlayerStore.getState();
    if (p.currentMusicId == null || loadedMusicRef.current !== p.currentMusicId || loadedSeqRef.current !== p.playSeq
      || !readyPlayer(playerRef.current) || currentVideoId(playerRef.current) !== loadedIdRef.current) return;
    wantPlayRef.current = 0;

    const unavailable = [100, 101, 150].includes(e.data);
    reportPlayback({ musicId: p.currentMusicId, playSeq: p.playSeq, state: unavailable ? "unavailable" : "paused", at: Date.now() });
    if (unavailable && p.queue.length) p.next();
    else p.pause();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    setReady(false);
    loadIframeApi().then(() => {
      if (cancelled || !window.YT || playerRef.current) return;
      playerRef.current = new window.YT.Player(host, {
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },

        events: {
          onReady: () => {
            if (cancelled || !readyPlayer(playerRef.current)) return;
            setReady(true);

            registerPlayer(playerRef.current);
          },
          onStateChange,
          onError,
        },
      });

      if (process.env.NODE_ENV !== "production") (window as unknown as { __odyPlayer?: YtPlayer }).__odyPlayer = playerRef.current;
    });
    return () => {
      cancelled = true;
      registerPlayer(null);
      if (readyPlayer(playerRef.current)) playerRef.current.destroy();
      playerRef.current = null;
      loadedIdRef.current = null;
      loadedMusicRef.current = null;
    };
  }, [onStateChange, onError]);

  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !readyPlayer(player)) return;
    if (!videoId) {
      if (loadedIdRef.current) {
        player.stopVideo();
        loadedIdRef.current = null;
        loadedMusicRef.current = null;
      }
      return;
    }

    if (loadedIdRef.current === videoId && loadedSeqRef.current === playSeq) return;
    loadedSeqRef.current = playSeq;
    loadedIdRef.current = videoId;
    loadedMusicRef.current = currentMusicId;
    startedSeqRef.current = null;
    endedSeqRef.current = null;

    if (usePlayerStore.getState().isPlaying) wantPlayRef.current = REPLAY_TRIES;
    player.loadVideoById(videoId);
  }, [ready, videoId, playSeq, currentMusicId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !videoId || !readyPlayer(player)) return;
    if (isPlaying) {
      if (player.getPlayerState() === ENDED) wantPlayRef.current = REPLAY_TRIES;
      player.playVideo();
    } else {
      wantPlayRef.current = 0;
      player.pauseVideo();
    }
  }, [ready, isPlaying, videoId]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-[28px] bottom-[192px] -z-10 w-[356px] overflow-hidden"
    >
      <div className="aspect-video w-full min-h-[200px]">
        <div ref={hostRef} className="h-full w-full" />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/format";
import { publishSeek } from "@/lib/realtime/ride";
import { useFollowStore } from "@/stores/use-follow-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { getPlayer } from "./player-registry";
import WaveformBars from "./waveform-bars";
import { track } from "@/lib/analytics/client";

const TICK_MS = 250;

const SEEK_SETTLE_MS = 1500;

const SEEK_TOLERANCE_S = 1.5;

interface PlayerProgressProps {
  musicId: number | null;

  durationSec?: number | null;

  canPlay?: boolean;
}

export default function PlayerProgress({ musicId, durationSec, canPlay = false }: PlayerProgressProps) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [clock, setClock] = useState({ musicId, t: 0, duration: 0 });

  const [scrub, setScrub] = useState<number | null>(null);

  const pendingSeek = useRef<{ t: number; until: number } | null>(null);

  if (clock.musicId !== musicId) {
    setClock({ musicId, t: 0, duration: 0 });
    setScrub(null);
  }

  useEffect(() => {
    if (musicId == null) return;
    const id = setInterval(() => {
      const p = getPlayer();
      if (!p) return;
      const t = p.getCurrentTime();
      const duration = p.getDuration();
      const pending = pendingSeek.current;
      if (pending) {
        if (Math.abs(t - pending.t) <= SEEK_TOLERANCE_S || Date.now() > pending.until) pendingSeek.current = null;
      }
      setClock((c) => {
        const nt = pendingSeek.current ? c.t : Number.isFinite(t) ? t : c.t;
        const nd = Number.isFinite(duration) && duration > 0 ? duration : c.duration;

        return nt === c.t && nd === c.duration ? c : { ...c, t: nt, duration: nd };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [musicId]);

  const duration = clock.duration;
  const value = Math.min(scrub ?? clock.t, duration || Infinity);
  const ratio = duration > 0 ? value / duration : 0;

  const riding = useFollowStore((s) => s.leaderEmail != null);
  const seekable = canPlay && duration > 0 && !riding;

  const shownDuration = duration || (durationSec != null && durationSec > 0 ? durationSec : 0);

  const commit = (next: number) => {
    if (!seekable || scrub == null) return;
    track("play_seeked", { music_id: musicId, from_sec: Math.round(clock.t), to_sec: Math.round(next) });
    getPlayer()?.seekTo(next, true);

    publishSeek(Math.round(next * 1000));
    pendingSeek.current = { t: next, until: Date.now() + SEEK_SETTLE_MS };
    setClock((c) => ({ ...c, t: next }));
    setScrub(null);
  };

  return (
    <div className="flex items-center gap-2.5">

      <span className="num w-10 shrink-0 text-[13.5px] text-ink-3 tabular-nums [text-shadow:0_1px_3px_rgba(2,4,10,.7)] max-tablet:w-8 max-tablet:text-[11px]">{shownDuration > 0 ? formatDuration(Math.round(value)) : "--:--"}</span>

      <div className="relative h-8 min-w-0 flex-1 max-tablet:h-2">

        <div className="h-full max-tablet:hidden">
          <WaveformBars musicId={musicId} ratio={ratio} playing={isPlaying && seekable && scrub == null} live={canPlay} />
        </div>
        <div aria-hidden className={`absolute inset-x-0 top-1/2 hidden h-[3px] -translate-y-1/2 overflow-hidden rounded-pill bg-white/[.16] max-tablet:block ${canPlay ? "" : "opacity-45"}`}>
          <div className="h-full rounded-pill bg-teal" style={{ width: `${Math.round(ratio * 1000) / 10}%` }} />
        </div>
        <input
          data-analytics-manual
          type="range"
          min={0}
          max={duration || 1}
          step={0.5}
          value={value}
          disabled={!seekable}
          aria-label="재생 위치"
          aria-valuetext={`${formatDuration(Math.round(value))} / ${formatDuration(Math.round(shownDuration))}`}
          onChange={(e) => setScrub(Number(e.target.value))}
          onPointerUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
          onKeyUp={(e) => commit(Number((e.target as HTMLInputElement).value))}

          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}

          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 outline-none disabled:cursor-default"
        />
      </div>
      <span className="num w-10 shrink-0 text-right text-[13.5px] text-ink-3 tabular-nums [text-shadow:0_1px_3px_rgba(2,4,10,.7)] max-tablet:w-8 max-tablet:text-[11px]">{shownDuration > 0 ? formatDuration(Math.round(shownDuration)) : "--:--"}</span>
    </div>
  );
}

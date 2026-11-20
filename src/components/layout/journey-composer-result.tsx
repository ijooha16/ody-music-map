"use client";

import { genreColor } from "@/constants/design-tokens";
import type { MusicSearchResult } from "@/types";

interface JourneyComposerResultProps {
  result: MusicSearchResult;
  isStart: boolean;
  isEnd: boolean;

  onPick: () => void;
}

export default function JourneyComposerResult({ result, isStart, isEnd, onPick }: JourneyComposerResultProps) {
  const color = genreColor(result.id % 10);
  const badge = isStart ? "출발" : isEnd ? "도착" : null;

  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2 text-left transition-colors duration-fast hover:bg-white/[.06]"
    >
      <span className="h-[22px] w-[3px] shrink-0 rounded-pill" style={{ background: color }} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px]">{result.title}</span>
        <span className="block truncate text-[13px] text-ink-3">{result.artist ?? "-"}</span>
      </span>
      {badge && <span className="lbl shrink-0 text-teal">{badge}</span>}
    </button>
  );
}

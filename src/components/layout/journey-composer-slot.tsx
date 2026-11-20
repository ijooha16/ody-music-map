"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/common/icons";
import { useMusicLabel } from "@/hooks/use-music-label";

interface JourneyComposerSlotProps {
  role: "start" | "end";
  musicId: number | null;

  active: boolean;

  keyword: string;
  onFocusSlot: () => void;
  onKeywordChange: (v: string) => void;
  onClear: () => void;
}

export default function JourneyComposerSlot({ role, musicId, active, keyword, onFocusSlot, onKeywordChange, onClear }: JourneyComposerSlotProps) {
  const { title, artist } = useMusicLabel(musicId);
  const isStart = role === "start";
  const editing = active && keyword.length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active && musicId == null) inputRef.current?.focus();
  }, [active, musicId]);
  const dot = isStart
    ? active
      ? "bg-teal shadow-[0_0_9px_#4fe3ce]"
      : "bg-teal/45"
    : active
      ? "bg-violet shadow-[0_0_9px_#a67cff]"
      : "bg-violet/45";

  return (
    <label className="flex cursor-text items-center gap-3 py-2.5">
      <span className={`h-[7px] w-[7px] shrink-0 rounded-pill transition-all duration-fast ${dot}`} />
      <span className="min-w-0 flex-1">
        <input
          ref={inputRef}
          className={`w-full bg-transparent text-[16px] outline-none ${musicId != null ? "placeholder:text-ink" : "placeholder:text-ink-4"}`}
          placeholder={musicId != null ? title : `${isStart ? "출발" : "도착"} 지점 검색`}
          value={active ? keyword : musicId != null ? title : ""}
          onFocus={onFocusSlot}
          onChange={(e) => onKeywordChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </span>
      {musicId != null && !editing && <span className="shrink-0 truncate text-[13.5px] text-ink-3">{artist}</span>}
      {musicId != null && !editing && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`${isStart ? "출발" : "도착"} 비우기`}
          className="shrink-0 text-ink-4 transition-colors hover:text-ink"
        >
          <CloseIcon size={14} />
        </button>
      )}
    </label>
  );
}

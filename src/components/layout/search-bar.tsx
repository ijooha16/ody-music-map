"use client";

import { useRef, useState } from "react";
import { CloseIcon, SearchIcon } from "@/components/common/icons";
import { RIDING_MAP_LOCKED } from "@/constants";
import { BREAKPOINTS } from "@/constants/design-tokens";
import { CHIP_LABEL, useMusicSearch } from "@/hooks/use-music-search";
import { useFollowStore } from "@/stores/use-follow-store";
import { usePanelStore } from "@/stores/use-panel-store";
import type { MusicSearchResult } from "@/types";
import SearchResultList from "./search-result-list";

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closePanel = usePanelStore((s) => s.close);

  const riding = useFollowStore((s) => s.leaderEmail != null);
  const { input, setInput, chip, inputRef, condition, results, query, reset, select, promote, removeChip, analytics } =
    useMusicSearch({ visible: open, source: "map_search" });
  const { isSuccess, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  const expand = () => {
    closePanel();
    setExpanded(true);
    setOpen(true);
    if (window.innerWidth < BREAKPOINTS.tablet) {
      inputRef.current?.focus();
      return;
    }

    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const collapse = () => {
    setExpanded(false);
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!wrapRef.current?.contains(document.activeElement)) collapse();
    }, 120);
  };

  const handleSelect = (r: MusicSearchResult) => {
    collapse();
    reset();
    select(r);
  };

  return (
    <div
      ref={wrapRef}
      data-analytics-manual
      data-hud

      data-search-web
      data-search-open={expanded || undefined}
      onBlur={handleBlur}

      title={riding ? RIDING_MAP_LOCKED : undefined}
      className={`absolute top-hud-t z-[22] [interpolate-size:allow-keywords] transition-[width,opacity] duration-300 ease-out left-1/2 -translate-x-1/2 max-tablet:left-gutter-sm max-tablet:translate-x-0 ${riding && !expanded ? "max-tablet:pointer-events-none max-tablet:opacity-40" : ""} ${expanded ? "w-[min(420px,34vw)] max-tablet:w-[calc(100dvw-2*var(--spacing-gutter-sm))] max-tablet:left-gutter-sm" : "w-fit max-tablet:w-8"}`}
    >

      <div

        className={`glass-liquid relative isolate flex h-11 items-center gap-[9px] overflow-hidden rounded-pill! px-[15px] max-tablet:glass-off max-tablet:transition-[height,margin] max-tablet:duration-300 max-tablet:ease-out ${expanded ? "max-tablet:-mt-1.5" : "cursor-pointer hover:border-line-2 max-tablet:h-8 max-tablet:justify-center max-tablet:px-0"}`}
        onMouseDown={(e) => {
          if (expanded) return;
          e.preventDefault();
          expand();
        }}
      >
        <span aria-hidden className={`glass-liquid pointer-events-none absolute inset-0 -z-10 hidden rounded-[inherit]! transition-opacity duration-300 max-tablet:block ${expanded ? "opacity-100" : "opacity-0"}`} />
        <SearchIcon className={`shrink-0 opacity-50 ${expanded ? "" : "max-tablet:size-6 max-tablet:text-ink max-tablet:opacity-100 max-tablet:drop-shadow-[0_1px_3px_rgb(0_0_0/0.7)]"}`} />
        {expanded && chip && (
          <span className="flex shrink-0 items-center gap-1 rounded-pill bg-white/[.08] py-0.5 pr-1 pl-2 text-[13.5px] whitespace-nowrap text-ink-2">
            {CHIP_LABEL[chip.kind]}: {chip.value}
            <button
              type="button"
              aria-label={`${CHIP_LABEL[chip.kind]} 조건 제거`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={removeChip}
              className="cursor-pointer rounded-pill p-0.5 text-ink-3 transition-colors hover:text-ink"
            >
              <CloseIcon size={12} />
            </button>
          </span>
        )}

        <input
          ref={inputRef}
          tabIndex={expanded ? 0 : -1}
          aria-hidden={!expanded}
          className={`min-w-0 bg-transparent text-[15px] outline-none max-tablet:text-[16px] placeholder:text-ink-3 ${expanded ? "flex-1" : "w-0 flex-none"}`}
          placeholder={chip ? (chip.kind === "artist" ? "제목 검색..." : "아티스트 검색...") : "음악 · 아티스트 검색"}
          autoComplete="off"
          spellCheck={false}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setExpanded(true);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              reset();
              inputRef.current?.blur();
              collapse();
              return;
            }

            if (e.key === "Backspace" && !input && chip) {
              e.preventDefault();
              removeChip();
            }
          }}
        />

        <span className={`lbl -mr-[1.75px] shrink-0 ${expanded ? "" : "max-tablet:hidden"}`}>search</span>
      </div>
      {expanded && open && (chip || input.trim()) && (
        <SearchResultList
          condition={condition}
          input={input.trim()}
          results={results}
          isSuccess={isSuccess}
          isError={isError}
          onRetry={() => void refetch()}
          onSelect={handleSelect}
          onPromote={promote}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={() => {
            analytics.more();
            void fetchNextPage();
          }}
        />
      )}
    </div>
  );
}

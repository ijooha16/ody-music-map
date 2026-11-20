"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CloseIcon, SearchIcon } from "@/components/common/icons";
import { ROUTES } from "@/constants";
import { useCoverMap } from "@/hooks/use-cover-map";
import { CHIP_LABEL, useMusicSearch } from "@/hooks/use-music-search";
import type { MusicSearchResult } from "@/types";
import SearchResultList from "./search-result-list";

export default function SearchScreen() {
  const router = useRouter();
  const { input, setInput, chip, inputRef, condition, results, query, select, promote, removeChip, analytics } =
    useMusicSearch({ visible: true, source: "search_page" });
  const { isSuccess, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useCoverMap();

  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const leave = () => router.push(ROUTES.home);

  const handleSelect = (r: MusicSearchResult) => {
    select(r);
    leave();
  };

  return (
    <main className="stage-bg fixed inset-x-0 top-0 bottom-[var(--nav-bottom)] z-[22] flex flex-col">
      <header className="flex items-center gap-2 px-gutter-sm pt-hud-t pb-2">
        <div className="glass-liquid flex h-11 min-w-0 flex-1 items-center gap-[9px] rounded-pill! pr-3 pl-[15px]">
          <SearchIcon className="shrink-0 opacity-50" />
          {chip && (
            <span className="flex shrink-0 items-center gap-1 rounded-pill bg-white/[.08] py-0.5 pr-1 pl-2 text-[13.5px] whitespace-nowrap text-ink-2">
              {CHIP_LABEL[chip.kind]}: {chip.value}
              <button
                type="button"
                aria-label={`${CHIP_LABEL[chip.kind]} 조건 제거`}
                onClick={removeChip}
                className="cursor-pointer rounded-pill p-0.5 text-ink-3 transition-colors hover:text-ink"
              >
                <CloseIcon size={12} />
              </button>
            </span>
          )}
          <input
            ref={inputRef}
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-3"
            placeholder={chip ? (chip.kind === "artist" ? "제목 검색..." : "아티스트 검색...") : "음악 · 아티스트 검색"}
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !input && chip) {
                e.preventDefault();
                removeChip();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={leave}
          className="h-touch shrink-0 px-1 text-[15px] text-ink-2 transition-colors hover:text-ink"
        >
          닫기
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-gutter-sm pb-hud-b">
        {(chip || input.trim()) && (
          <SearchResultList
            variant="page"
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
        {!chip && !input.trim() && (
          <p className="pt-10 text-center text-[14.5px] leading-[1.7] text-ink-3">
            곡 제목이나 아티스트를 입력해 보세요
            <br />
            고른 곡은 지도에서 찾아 줍니다
          </p>
        )}
      </div>
    </main>
  );
}

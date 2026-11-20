"use client";

import { genreColor } from "@/constants/design-tokens";
import { useLoadMoreOnBottom } from "@/hooks/use-load-more-on-bottom";
import type { MusicSearchResult, SearchCondition } from "@/types";

interface SearchResultListProps {
  condition: SearchCondition;

  input: string;
  results: MusicSearchResult[];

  isSuccess: boolean;

  isError: boolean;
  onRetry: () => void;
  onSelect: (r: MusicSearchResult) => void;

  onPromote: (kind: "artist" | "music") => void;

  hasMore: boolean;

  isLoadingMore: boolean;

  variant?: "dropdown" | "page";

  onLoadMore: () => void;
}

function heading(c: SearchCondition): string {
  if (c.mode === "all") return "음악 또는 아티스트 검색 결과";
  if (c.mode === "artist") return c.music ? `${c.artist}의 “${c.music}” 음악` : `${c.artist}의 음악`;
  return c.artist ? `“${c.music}” 제목의 ${c.artist} 음악` : `“${c.music}” 제목의 음악`;
}

export default function SearchResultList({
  condition,
  input,
  results,
  isSuccess,
  isError,
  onRetry,
  onSelect,
  onPromote,
  hasMore,
  isLoadingMore,
  onLoadMore,
  variant = "dropdown",
}: SearchResultListProps) {
  const { boxRef, onScroll } = useLoadMoreOnBottom({ hasMore, isLoadingMore, count: results.length, onLoadMore });

  const canPromote = condition.mode === "all" && input.length > 0;
  return (
    <div
      ref={boxRef}
      onScroll={onScroll}

      onMouseDown={(e) => e.preventDefault()}
      className={variant === "page" ? "pt-1" : "glass mt-[7px] max-h-[46vh] overflow-y-auto rounded-[15px]!"}
    >

      {canPromote && (
        <div className="border-b border-white/[.08]">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onPromote("artist")} className={ACTION_CLASS}>
            <span className="truncate">“{input}”를 아티스트로 검색</span>
            <span className="shrink-0 text-ink-4">›</span>
          </button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onPromote("music")} className={ACTION_CLASS}>
            <span className="truncate">“{input}”를 제목으로 검색</span>
            <span className="shrink-0 text-ink-4">›</span>
          </button>
        </div>
      )}

      <p className="px-[13px] pt-[9px] pb-1 text-[13px] text-ink-4">{heading(condition)}</p>

      {isError ? (
        <div className="flex items-center justify-between gap-2 px-[13px] py-[9px]">
          <span className="text-xs text-ink-3">검색하지 못했습니다. 다시 시도해 주세요.</span>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onRetry} className="shrink-0 cursor-pointer text-xs text-teal hover:underline">
            재시도
          </button>
        </div>
      ) : results.length === 0 ? (
        <p className="px-[13px] py-[9px] text-xs text-ink-3">{isSuccess ? "일치하는 음악이 없습니다." : "검색 중..."}</p>
      ) : (
        <>
          {results.map((r) => {
            const color = genreColor(r.id % 10);
            return (
              <button
                key={r.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(r)}
                className="flex w-full items-center gap-2.5 border-b border-white/[.045] px-[13px] py-[9px] text-left transition-colors last:border-b-0 hover:bg-white/[.06]"
              >
                <span className="h-[7px] w-[7px] shrink-0 rounded-pill" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] leading-[1.3]">{r.title}</span>
                  <span className="block truncate text-[13px] text-ink-3">{r.artist ?? "-"}</span>
                </span>
              </button>
            );
          })}

          {isLoadingMore && <p className="px-[13px] py-[9px] text-center text-[13px] text-ink-3">다음 10곡 불러오는 중...</p>}
          {!hasMore && !isLoadingMore && <p className="px-[13px] py-[9px] text-center text-[13px] text-ink-4">결과 끝</p>}
        </>
      )}
    </div>
  );
}

const ACTION_CLASS =
  "flex w-full cursor-pointer items-center justify-between gap-2 px-[13px] py-[9px] text-left text-[14px] text-ink-2 transition-colors hover:bg-white/[.06]";

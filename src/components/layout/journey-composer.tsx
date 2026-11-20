"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/common/icons";
import { flattenSearch, useMusicSearchQuery } from "@/hooks/queries/use-music-search-query";
import { useIsNarrow } from "@/hooks/use-is-narrow";
import { useLoadMoreOnBottom } from "@/hooks/use-load-more-on-bottom";
import { useJourneyStore } from "@/stores/use-journey-store";
import { rememberMusicHints } from "@/lib/music-hints";
import { usePanelStore } from "@/stores/use-panel-store";
import { useTutorialStore } from "@/stores/use-tutorial-store";
import JourneyComposerResult from "./journey-composer-result";
import JourneyComposerSlot from "./journey-composer-slot";
import { useSearchAnalytics } from "@/hooks/use-search-analytics";
import { requestJourney } from "@/lib/analytics/flows";
import { track } from "@/lib/analytics/client";
import type { MusicSearchResult } from "@/types";

export default function JourneyComposer() {
  const [keyword, setKeyword] = useState("");

  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useMusicSearchQuery({ mode: "all", query: keyword });
  const results = flattenSearch(data?.pages);

  const { boxRef, onScroll } = useLoadMoreOnBottom({
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    count: results.length,
    onLoadMore: () => void fetchNextPage(),
  });
  const startMusicId = useJourneyStore((s) => s.startMusicId);
  const endMusicId = useJourneyStore((s) => s.endMusicId);
  const pickTarget = useJourneyStore((s) => s.pickTarget);
  const setStart = useJourneyStore((s) => s.setStart);
  const setEnd = useJourneyStore((s) => s.setEnd);
  const setPickTarget = useJourneyStore((s) => s.setPickTarget);
  const swap = useJourneyStore((s) => s.swap);
  const requestRoute = useJourneyStore((s) => s.requestRoute);
  const close = useJourneyStore((s) => s.closeComposer);
  const openJourneyPanel = usePanelStore((s) => s.openJourney);
  const narrow = useIsNarrow();

  const ready = startMusicId != null && endMusicId != null && startMusicId !== endMusicId;
  const searching = keyword.trim().length > 0;
  const analytics = useSearchAnalytics({ keyword, visible: searching, pending: isPending, count: results.length, pages: data?.pages.length ?? 0, source: `journey_${pickTarget ?? "start"}` });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const focusSlot = (target: "start" | "end") => {
    if (pickTarget !== target) setKeyword("");
    setPickTarget(target);
  };

  const handleCreate = () => {
    if (!ready) return;
    requestJourney(startMusicId, endMusicId);
    requestRoute();

    openJourneyPanel(narrow ? 1 : undefined);

    useTutorialStore.getState().complete("journey");
  };

  const pick = (result: MusicSearchResult, target: "start" | "end") => {
    const musicId = result.id;
    analytics.select(musicId, results.findIndex((r) => r.id === musicId) + 1);

    rememberMusicHints([result]);
    if (target === "start") setStart(musicId);
    else setEnd(musicId);
    setKeyword("");
  };

  return (
    <div data-analytics-manual data-hud data-tutorial="journey-composer" className="glass-liquid animate-tin absolute top-hud-t left-1/2 z-[24] w-[min(520px,46vw)] -translate-x-1/2 overflow-hidden rounded-[22px]! p-0! max-tablet:w-[calc(100dvw-2*var(--spacing-gutter-sm))]">
      <header className="flex items-center gap-2 px-4 pt-3">
        <span className="lbl">여정 만들기</span>
        <span className="flex-1" />
        <button type="button" onClick={close} aria-label="닫기" className="text-ink-3 transition-colors hover:text-ink">
          <CloseIcon size={15} />
        </button>
      </header>

      <div className="flex items-center gap-2 px-4">
        <div className="min-w-0 flex-1 divide-y divide-line">
          <JourneyComposerSlot
            role="start"
            musicId={startMusicId}
            active={pickTarget === "start"}
            keyword={keyword}
            onFocusSlot={() => focusSlot("start")}
            onKeywordChange={setKeyword}
            onClear={() => setStart(null)}
          />
          <JourneyComposerSlot
            role="end"
            musicId={endMusicId}
            active={pickTarget === "end"}
            keyword={keyword}
            onFocusSlot={() => focusSlot("end")}
            onKeywordChange={setKeyword}
            onClear={() => setEnd(null)}
          />
        </div>
        <button
          type="button"
          onClick={() => { track("journey_endpoints_swapped"); swap(); }}
          aria-label="출발·도착 바꾸기"
          title="출발·도착 바꾸기"
          className="shrink-0 rounded-pill px-2 py-1.5 text-[15px] text-ink-3 transition-colors hover:bg-white/[.07] hover:text-ink"
        >
          ⇅
        </button>
      </div>

      {searching && (
        <div ref={boxRef} onScroll={onScroll} className="max-h-[42vh] overflow-y-auto border-t border-line px-1.5 py-1.5">
          {isPending && <p className="lbl px-2 py-4 text-center">검색 중</p>}
          {!isPending && results.length === 0 && <p className="lbl px-2 py-4 text-center">일치하는 음악이 없습니다</p>}
          {results.map((r) => (
            <JourneyComposerResult
              key={r.id}
              result={r}
              isStart={r.id === startMusicId}
              isEnd={r.id === endMusicId}
              onPick={() => pick(r, pickTarget === "end" ? "end" : "start")}
            />
          ))}

          {isFetchingNextPage && <p className="lbl px-2 py-2 text-center">다음 10곡 불러오는 중...</p>}
          {results.length > 0 && !hasNextPage && !isFetchingNextPage && <p className="lbl px-2 py-2 text-center">결과 끝</p>}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <span className="text-[13px] text-ink-4">{ready ? "지도에서 눌러 바꿀 수도 있어요" : "지도에서 곡을 눌러도 채워집니다"}</span>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!ready}
          data-tutorial="journey-create"
          className="grad-bg rounded-pill px-3.5 py-1.5 text-[14.5px] font-medium text-void transition-opacity duration-fast disabled:pointer-events-none disabled:opacity-30"
        >
          경로 만들기
        </button>
      </div>
    </div>
  );
}

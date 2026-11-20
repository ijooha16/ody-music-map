"use client";

import { useCallback, useEffect, useRef } from "react";
import { SEARCH_LOAD_MORE_MARGIN_PX } from "@/constants";

export function atBottom(box: { scrollTop: number; clientHeight: number; scrollHeight: number }): boolean {
  return box.scrollTop + box.clientHeight >= box.scrollHeight - SEARCH_LOAD_MORE_MARGIN_PX;
}

interface LoadMoreOnBottom {
  hasMore: boolean;

  isLoadingMore: boolean;

  count: number;

  onLoadMore: () => void;
}

export function useLoadMoreOnBottom({ hasMore, isLoadingMore, count, onLoadMore }: LoadMoreOnBottom) {
  const boxRef = useRef<HTMLDivElement>(null);

  const loadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const check = useCallback(() => {
    const box = boxRef.current;
    if (!box || !hasMore || isLoadingMore) return;
    if (atBottom(box)) loadMoreRef.current();
  }, [hasMore, isLoadingMore]);

  useEffect(() => check(), [check, count]);

  return { boxRef, onScroll: check };
}

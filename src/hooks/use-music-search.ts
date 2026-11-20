"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SEARCH_DEBOUNCE_MS } from "@/constants";
import { musicDetailQueryOptions } from "@/hooks/queries/use-music-detail-query";
import { flattenSearch, useMusicSearchQuery } from "@/hooks/queries/use-music-search-query";
import { useSearchAnalytics } from "@/hooks/use-search-analytics";
import { musicToMapPoint } from "@/lib/map-point";
import { useMapStore } from "@/stores/use-map-store";
import { rememberMusicHints } from "@/lib/music-hints";
import { usePanelStore } from "@/stores/use-panel-store";
import { useUnplayableStore } from "@/stores/use-unplayable-store";
import type { MapPoint, MusicSearchResult, SearchCondition } from "@/types";

export type Chip = { kind: "artist" | "music"; value: string } | null;

export const CHIP_LABEL = { artist: "아티스트", music: "제목" } as const;

function conditionOf(chip: Chip, input: string): SearchCondition {
  if (!chip) return { mode: "all", query: input };
  if (chip.kind === "artist") return { mode: "artist", artist: chip.value, music: input };
  return { mode: "music", music: chip.value, artist: input };
}

export function useMusicSearch({ visible, source }: { visible: boolean; source: string }) {
  const [input, setInput] = useState("");
  const [chip, setChip] = useState<Chip>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  const condition = conditionOf(chip, debounced);
  const query = useMusicSearchQuery(condition);

  const unplayableIds = useUnplayableStore((s) => s.ids);
  const rawResults = flattenSearch(query.data?.pages);
  const results = useMemo(() => rawResults.filter((r) => !unplayableIds.has(r.id)), [rawResults, unplayableIds]);
  const analytics = useSearchAnalytics({
    keyword: chip ? `${chip.kind}:${chip.value} ${debounced}` : debounced,
    visible,
    pending: query.isPending,
    count: results.length,
    pages: query.data?.pages.length ?? 0,
    source,
  });
  const revealMusic = useMapStore((s) => s.revealMusic);
  const openSong = usePanelStore((s) => s.openSong);
  const qc = useQueryClient();

  const reset = () => {
    setInput("");
    setDebounced("");
    setChip(null);
  };

  const select = (r: MusicSearchResult) => {
    analytics.select(r.id, results.findIndex((item) => item.id === r.id) + 1);

    rememberMusicHints([r]);
    openSong(r.id);
    void revealOnMap(r.id);
  };

  const revealOnMap = async (musicId: number) => {
    let point: MapPoint | null = null;
    try {
      const detail = await qc.fetchQuery(musicDetailQueryOptions(musicId));
      point = musicToMapPoint(detail);
    } catch {
      /* 좌표 없이 간다 */
    }
    revealMusic(musicId, point);
  };

  const promote = (kind: "artist" | "music") => {
    const value = input.trim();
    if (!value) return;
    setChip({ kind, value });
    setInput("");
    setDebounced("");
    inputRef.current?.focus();
  };

  const removeChip = () => {
    setChip(null);
    inputRef.current?.focus();
  };

  return { input, setInput, chip, inputRef, condition, results, query, reset, select, promote, removeChip, analytics };
}

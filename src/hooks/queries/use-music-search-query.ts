import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import type { MusicSearchPage, MusicSearchResult, SearchCondition } from "@/types";

function normalize(c: SearchCondition): SearchCondition {
  if (c.mode === "all") return { mode: "all", query: c.query.trim() };
  if (c.mode === "artist") return { mode: "artist", artist: c.artist.trim(), music: c.music.trim() };
  return { mode: "music", music: c.music.trim(), artist: c.artist.trim() };
}

export function canSearch(c: SearchCondition): boolean {
  const n = normalize(c);
  if (n.mode === "all") return n.query.length > 0;
  if (n.mode === "artist") return n.artist.length > 0;
  return n.music.length > 0;
}

export function searchRequestPath(c: SearchCondition, page: number): string {
  const n = normalize(c);
  const p = new URLSearchParams();
  if (n.mode === "all") p.set("q", n.query);
  else if (n.mode === "artist") {
    p.set("artist", n.artist);
    if (n.music) p.set("music", n.music);
  } else {
    p.set("music", n.music);
    if (n.artist) p.set("artist", n.artist);
  }
  p.set("page", String(page));
  return `${API_ENDPOINTS.music.search}?${p.toString()}`;
}

export function useMusicSearchQuery(condition: SearchCondition) {
  const c = normalize(condition);
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.music.search(c),
    queryFn: ({ pageParam }) => api<MusicSearchPage>(searchRequestPath(c, pageParam)),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: canSearch(c),
  });
}

export function flattenSearch(pages: MusicSearchPage[] | undefined): MusicSearchResult[] {
  const seen = new Set<number>();
  const out: MusicSearchResult[] = [];
  for (const page of pages ?? []) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

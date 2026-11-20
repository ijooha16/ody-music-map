import { SEARCH_PAGE_SIZE, TITLE_SEARCH_MAX_UPSTREAM_PAGES } from "@/constants";
import type { BackendMusicDetail } from "@/lib/backend";
import type { MusicSearchPage } from "@/types";

export interface BackendSearchResponse {
  content: BackendMusicDetail[];
  page: number;
  size: number;
  hasNext: boolean;
}

export async function searchTitleOnlyPage(
  music: string,
  page: number,
  readPage: (page: number) => Promise<BackendSearchResponse>,
): Promise<MusicSearchPage> {
  const prefix = music.toLowerCase();
  const needed = (page + 1) * SEARCH_PAGE_SIZE + 1;
  const matches: BackendMusicDetail[] = [];

  for (let upstreamPage = 0; upstreamPage < TITLE_SEARCH_MAX_UPSTREAM_PAGES && matches.length < needed; upstreamPage += 1) {
    const res = await readPage(upstreamPage);
    matches.push(...res.content.filter((item) => item.title.toLowerCase().startsWith(prefix)));
    if (!res.hasNext) break;
  }

  const from = page * SEARCH_PAGE_SIZE;
  return {
    items: matches.slice(from, from + SEARCH_PAGE_SIZE).map((item) => ({ id: item.id, title: item.title, artist: item.artist })),
    page,
    hasNext: matches.length > from + SEARCH_PAGE_SIZE,
  };
}

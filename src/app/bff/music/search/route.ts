import { failLive, fail, ok, okLive } from "@/lib/api-response";
import { backendGet, BackendError, isBackendEnabled, type BackendMusicDetail } from "@/lib/backend";
import { SEARCH_PAGE_SIZE } from "@/constants";
import { mockSearch } from "@/mocks/music";
import type { MusicSearchPage } from "@/types";
import { searchTitleOnlyPage, type BackendSearchResponse } from "./title-search";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const artist = (sp.get("artist") ?? "").trim();
  const music = (sp.get("music") ?? "").trim();
  const page = Math.max(0, Number(sp.get("page") ?? 0) || 0);
  const empty: MusicSearchPage = { items: [], page, hasNext: false };

  if (q && (artist || music)) return fail("INVALID_INPUT", "통합 검색과 조건 검색을 함께 쓸 수 없습니다.", 400);
  if (!q && !artist && !music) return ok(empty);

  if (!isBackendEnabled()) return ok(mockSearchPage({ q, artist, music }, page));

  if (music && !artist) {
    let upstream = titleFallbackPath(music, 0);
    try {
      const body = await searchTitleOnlyPage(music, page, (upstreamPage) => {
        upstream = titleFallbackPath(music, upstreamPage);
        return backendGet<BackendSearchResponse>(upstream);
      });
      return okLive(body, upstream);
    } catch (e) {
      const err = e as BackendError;
      return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
    }
  }

  const upstream = `/api/music/search?${backendQuery({ q, artist, music, page })}`;
  try {
    const res = await backendGet<BackendSearchResponse>(upstream);
    const body: MusicSearchPage = {
      items: res.content.map((m) => ({ id: m.id, title: m.title, artist: m.artist })),
      page: res.page ?? page,
      hasNext: res.hasNext ?? false,
    };
    return okLive(body, upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive("INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}

function titleFallbackPath(music: string, page: number): string {
  const p = new URLSearchParams({ query: music, page: String(page) });
  return `/api/music/search?${p.toString()}`;
}

function backendQuery({ q, artist, music, page }: { q: string; artist: string; music: string; page: number }): string {
  const p = new URLSearchParams();
  if (q) p.set("query", q);
  else {
    p.set("artist", artist);
    if (music) p.set("music", music);
  }
  p.set("page", String(page));
  return p.toString();
}

function mockSearchPage(cond: { q: string; artist: string; music: string }, page: number): MusicSearchPage {
  const all = mockSearch(cond);
  const from = page * SEARCH_PAGE_SIZE;
  return { items: all.slice(from, from + SEARCH_PAGE_SIZE), page, hasNext: from + SEARCH_PAGE_SIZE < all.length };
}

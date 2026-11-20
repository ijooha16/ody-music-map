/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { canSearch, searchRequestPath, flattenSearch } = require("../src/hooks/queries/use-music-search-query.ts");
const { QUERY_KEYS } = require("../src/constants/index.ts");
const { TITLE_SEARCH_MAX_UPSTREAM_PAGES } = require("../src/constants/search.ts");
const { searchTitleOnlyPage } = require("../src/app/bff/music/search/title-search.ts");
const { atBottom } = require("../src/hooks/use-load-more-on-bottom.ts");
const { SEARCH_LOAD_MORE_MARGIN_PX } = require("../src/constants/index.ts");

const params = (path) => Object.fromEntries(new URL(path, "http://x").searchParams);

test("통합 검색은 q 만 보낸다 — query 와 music/artist 를 섞지 않는다", () => {
  assert.deepEqual(params(searchRequestPath({ mode: "all", query: "Love" }, 0)), { q: "Love", page: "0" });
});

test("아티스트 검색은 artist 만 보낸다. 빈 선택 입력은 생략한다", () => {
  assert.deepEqual(params(searchRequestPath({ mode: "artist", artist: "Radiohead", music: "" }, 0)), { artist: "Radiohead", page: "0" });
});

test("아티스트 안에서 음악을 좁히면 둘 다 보낸다", () => {
  assert.deepEqual(params(searchRequestPath({ mode: "artist", artist: "Radiohead", music: "Creep" }, 0)), {
    artist: "Radiohead",
    music: "Creep",
    page: "0",
  });
});

test("음악을 아티스트로 좁히면 music 과 artist 를 함께 보낸다", () => {
  assert.deepEqual(params(searchRequestPath({ mode: "music", music: "Love", artist: "Lana Del Rey" }, 0)), {
    music: "Love",
    artist: "Lana Del Rey",
    page: "0",
  });
});

test("제목 칩만 있어도 music 으로 검색한다", () => {
  assert.deepEqual(params(searchRequestPath({ mode: "music", music: "Love", artist: "" }, 0)), {
    music: "Love",
    page: "0",
  });
});

test("앞뒤 공백은 검색어가 아니다", () => {
  assert.deepEqual(params(searchRequestPath({ mode: "all", query: "  Love  " }, 2)), { q: "Love", page: "2" });
});

test("music 단독도 요청한다 — BFF 가 통합 검색 결과를 제목으로 거른다", () => {
  assert.equal(canSearch({ mode: "music", music: "Love", artist: "" }), true);
  assert.equal(canSearch({ mode: "music", music: "Love", artist: "Lana" }), true);
});

test("빈 통합 검색어·빈 아티스트는 요청하지 않는다", () => {
  assert.equal(canSearch({ mode: "all", query: "   " }), false);
  assert.equal(canSearch({ mode: "artist", artist: "", music: "Creep" }), false);
  assert.equal(canSearch({ mode: "artist", artist: "Radiohead", music: "" }), true);
});

test("같은 문자열이라도 모드가 다르면 다른 캐시다 — 이전 조건 결과가 남으면 안 된다", () => {
  const all = QUERY_KEYS.music.search({ mode: "all", query: "Love" });
  const artist = QUERY_KEYS.music.search({ mode: "artist", artist: "Love", music: "" });
  const music = QUERY_KEYS.music.search({ mode: "music", music: "Love", artist: "" });
  assert.notDeepEqual(all, artist);
  assert.notDeepEqual(all, music);
  assert.notDeepEqual(artist, music);
});

test("같은 조건이면 같은 키다", () => {
  assert.deepEqual(QUERY_KEYS.music.search({ mode: "artist", artist: "Radiohead", music: "Creep" }), QUERY_KEYS.music.search({ mode: "artist", artist: "Radiohead", music: "Creep" }));
});

test("페이지를 이어 붙일 때 같은 음악이 두 번 뜨지 않는다", () => {
  const pages = [
    { items: [{ id: 1, title: "a", artist: null }, { id: 2, title: "b", artist: null }], page: 0, hasNext: true },
    { items: [{ id: 2, title: "b", artist: null }, { id: 3, title: "c", artist: null }], page: 1, hasNext: false },
  ];
  assert.deepEqual(flattenSearch(pages).map((r) => r.id), [1, 2, 3]);
});

test("받아 둔 페이지가 없으면 빈 목록이다", () => {
  assert.deepEqual(flattenSearch(undefined), []);
});

test("제목 단독 검색은 통합 검색 페이지를 훑어 한 페이지를 채운다", async () => {
  let calls = 0;
  const page = await searchTitleOnlyPage("Love", 0, async (upstreamPage) => {
    calls += 1;
    const count = upstreamPage === 0 ? 6 : 5;
    return {
      content: Array.from({ length: count }, (_, i) => ({ id: upstreamPage * 10 + i, title: `Love ${upstreamPage}-${i}`, artist: "Artist" })),
      page: upstreamPage,
      size: 10,
      hasNext: true,
    };
  });

  assert.equal(calls, 2);
  assert.equal(page.items.length, 10);
  assert.equal(page.hasNext, true);
  assert.ok(page.items.every((item) => item.title.startsWith("Love")));
});

test("제목 단독 검색은 일치 결과가 없어도 정해진 페이지만 조회하고 끝낸다", async () => {
  let calls = 0;
  const page = await searchTitleOnlyPage("Love", 0, async (upstreamPage) => {
    calls += 1;
    return {
      content: [{ id: upstreamPage, title: "Other", artist: "Love Artist" }],
      page: upstreamPage,
      size: 10,
      hasNext: true,
    };
  });

  assert.equal(calls, TITLE_SEARCH_MAX_UPSTREAM_PAGES);
  assert.deepEqual(page, { items: [], page: 0, hasNext: false });
});

const { mockSearch } = require("../src/mocks/music.ts");

const titles = (rows) => rows.map((r) => r.title);

test("목도 앞일치다 — 부분일치로 두면 목에서만 나오는 결과가 생긴다", () => {
  const hit = mockSearch({ q: "a", artist: "", music: "" });
  assert.ok(hit.every((r) => r.title.toLowerCase().startsWith("a") || (r.artist ?? "").toLowerCase().startsWith("a")));
});

test("통합 검색은 제목 또는 아티스트에서 찾는다", () => {
  const rows = mockSearch({ q: "the", artist: "", music: "" });
  assert.ok(rows.every((r) => r.title.toLowerCase().startsWith("the") || (r.artist ?? "").toLowerCase().startsWith("the")));
});

test("아티스트 조건은 아티스트에만 건다", () => {
  const any = mockSearch({ q: "", artist: "a", music: "" });
  assert.ok(any.every((r) => (r.artist ?? "").toLowerCase().startsWith("a")));
});

test("아티스트 + 음악은 둘 다 만족해야 한다", () => {
  const both = mockSearch({ q: "", artist: "a", music: "s" });
  assert.ok(both.every((r) => (r.artist ?? "").toLowerCase().startsWith("a") && r.title.toLowerCase().startsWith("s")));

  const wide = new Set(titles(mockSearch({ q: "", artist: "a", music: "" })));
  assert.ok(titles(both).every((t) => wide.has(t)));
});

test("음악 조건만 있으면 제목 앞일치 결과를 준다", () => {
  const rows = mockSearch({ q: "", artist: "", music: "a" });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => r.title.toLowerCase().startsWith("a")));
});

test("조건이 하나도 없으면 아무것도 안 준다", () => {
  assert.deepEqual(mockSearch({ q: "", artist: "", music: "" }), []);
});

const box = (scrollTop, clientHeight = 200, scrollHeight = 1000) => ({ scrollTop, clientHeight, scrollHeight });

test("스크롤을 안 했으면 바닥이 아니다 — 첫 렌더에 다음 페이지를 당기지 않는다", () => {
  assert.equal(atBottom(box(0)), false);
});

test("바닥 여유 안에 들어오면 바닥으로 센다", () => {
  assert.equal(atBottom(box(1000 - 200 - SEARCH_LOAD_MORE_MARGIN_PX)), true);
  assert.equal(atBottom(box(1000 - 200 - SEARCH_LOAD_MORE_MARGIN_PX - 1)), false);
});

test("내용이 상자보다 짧으면(스크롤이 안 생기면) 처음부터 바닥이다", () => {
  assert.equal(atBottom(box(0, 200, 120)), true);
});

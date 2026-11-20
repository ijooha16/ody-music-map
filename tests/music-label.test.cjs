/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveMusicLabel } = require("../src/lib/music-label.ts");
const { rememberMusicHints, getMusicHint, musicHintCount, clearMusicHints, subscribeMusicHints } = require("../src/lib/music-hints.ts");

test("누를 때 넘긴 제목이 상세보다 먼저 보인다", () => {
  const label = resolveMusicLabel(7, undefined, { title: "Blue Monday", artist: "New Order" });
  assert.equal(label.title, "Blue Monday");
  assert.equal(label.artist, "New Order");
  assert.equal(label.isHint, true);
});

test("상세가 오면 힌트를 대신한다", () => {
  const label = resolveMusicLabel(7, { title: "Blue Monday '88", artist: "New Order" }, { title: "Blue Monday", artist: "New Order" });
  assert.equal(label.title, "Blue Monday '88");
  assert.equal(label.isHint, false);
});

test("상세의 빈 아티스트를 힌트로 덮지 않는다", () => {
  const label = resolveMusicLabel(7, { title: "Untitled", artist: null }, { title: "Untitled", artist: "누군가" });
  assert.equal(label.artist, null);
});

test("아무것도 없을 때만 Track 으로 떨어진다", () => {
  assert.equal(resolveMusicLabel(12345, undefined, undefined).title, "Track 12345");
  assert.equal(resolveMusicLabel(null, undefined, undefined).title, "");
});

test("힌트는 넘긴 곡 전부를 담는다 — 큐로 넘어가도 제목이 서 있다", () => {
  clearMusicHints();
  rememberMusicHints([
    { id: 1, title: "첫 곡", artist: "A" },
    { id: 2, title: "둘째 곡", artist: null },
  ]);
  assert.equal(getMusicHint(1).title, "첫 곡");
  assert.equal(getMusicHint(2).artist, null);
});

test("제목 없는 곡은 힌트로 담지 않는다", () => {
  clearMusicHints();
  rememberMusicHints([{ id: 3, title: "", artist: "A" }]);
  assert.equal(getMusicHint(3), undefined);
});

test("힌트는 상한을 넘지 않고 오래된 것부터 버린다", () => {
  clearMusicHints();
  rememberMusicHints(Array.from({ length: 600 }, (_, i) => ({ id: i, title: `곡 ${i}`, artist: null })));
  assert.equal(musicHintCount(), 512);
  assert.equal(getMusicHint(0), undefined, "먼저 넣은 것이 먼저 나간다");
  assert.ok(getMusicHint(599), "방금 넣은 것은 남는다");
});

test("같은 값을 다시 넘기면 객체도 알림도 그대로다", () => {
  clearMusicHints();
  rememberMusicHints([{ id: 9, title: "같은 곡", artist: "A" }]);
  const before = getMusicHint(9);

  let notified = 0;
  const stop = subscribeMusicHints(() => { notified += 1; });
  rememberMusicHints([{ id: 9, title: "같은 곡", artist: "A" }]);
  stop();

  assert.equal(getMusicHint(9), before, "같은 객체여야 렌더가 걸러진다");
  assert.equal(notified, 0, "바뀐 게 없으면 알리지도 않는다");
});

test("새 힌트가 들어오면 구독자에게 알린다", () => {
  clearMusicHints();
  let notified = 0;
  const stop = subscribeMusicHints(() => { notified += 1; });
  rememberMusicHints([{ id: 11, title: "새 곡", artist: null }]);
  stop();
  assert.equal(notified, 1);
});

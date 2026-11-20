/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { shouldFollowPlayback } = require("../src/components/map/selection-follow.ts");

const base = { playingMusicId: 7, selectedMusicId: 3, restored: false, riding: false };

test("재생이 선택과 다른 곡으로 넘어가면 선택을 데려간다", () => {
  assert.equal(shouldFollowPlayback(base), true);
  assert.equal(shouldFollowPlayback({ ...base, selectedMusicId: null }), true, "아무것도 안 골라 둔 상태");
});

test("이미 그 곡이 선택돼 있으면 할 일이 없다", () => {
  assert.equal(shouldFollowPlayback({ ...base, selectedMusicId: 7 }), false);
});

test("따라가는 중에는 재생을 좇지 않는다", () => {
  assert.equal(shouldFollowPlayback({ ...base, riding: true }), false);
});

test("새로고침으로 되살린 곡에는 링을 붙이지 않는다", () => {
  assert.equal(shouldFollowPlayback({ ...base, restored: true }), false);
});

test("재생 중인 곡이 없으면 아무것도 안 한다", () => {
  assert.equal(shouldFollowPlayback({ ...base, playingMusicId: null }), false);
});

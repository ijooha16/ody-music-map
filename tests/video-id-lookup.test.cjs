/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { videoIdLookup } = require("../src/app/bff/music/[id]/video-id/route.ts");

test("줄이 아예 없으면 그 곡이 없는 것이다 — 삭제된 곡", () => {
  assert.equal(videoIdLookup(undefined), "notFound");
  assert.equal(videoIdLookup(null), "notFound");
});

test('"none" 은 찾아봤는데 없었다는 뜻이다', () => {
  assert.equal(videoIdLookup({ videoId: "none" }), "notFound");
});

test("빈 문자열도 같게 본다 — 검색 결과가 비었다", () => {
  assert.equal(videoIdLookup({ videoId: "" }), "notFound");
});

test("null 은 **아직 안 찾아봤다** — 여기만 다시 물을 값이 있다", () => {
  assert.equal(videoIdLookup({ videoId: null }), "unsearched");
});

test("값이 있으면 있는 것이다", () => {
  assert.equal(videoIdLookup({ videoId: "PWVy0cYS-9Q" }), "found");
});

test("없는 곡과 아직 모르는 곡은 서로 다른 답이다", () => {
  assert.notEqual(videoIdLookup(undefined), videoIdLookup({ videoId: null }));
});

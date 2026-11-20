/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { layerSetsToEvict, MAX_CACHED_LAYER_SETS } = require("../src/lib/map-songs-cache.ts");

const set = (key, usedAt, active = false) => ({ key, usedAt, active });

test("상한 아래면 아무것도 버리지 않는다", () => {
  assert.deepEqual(layerSetsToEvict([set("a", 1), set("b", 2)], 4), []);
});

test("넘치면 오래 안 쓴 것부터 넘친 만큼만 버린다", () => {
  const entries = [set("old", 1), set("mid", 2), set("new", 3), set("newest", 4)];
  assert.deepEqual(layerSetsToEvict(entries, 2), ["old", "mid"]);
});

test("보는 컴포넌트가 있는 집합은 가장 오래됐어도 지우지 않는다", () => {
  const entries = [set("watching", 1, true), set("idle", 2), set("newer", 3)];

  assert.deepEqual(layerSetsToEvict(entries, 2), ["idle"]);
});

test("버릴 수 있는 게 모자라면 상한을 넘은 채로 둔다 — 쓰는 것을 빼앗지 않는다", () => {
  const entries = [set("a", 1, true), set("b", 2, true), set("c", 3, true)];
  assert.deepEqual(layerSetsToEvict(entries, 1), []);
});

test("상한은 파고드는 길 한 벌보다 넉넉하다", () => {
  assert.ok(MAX_CACHED_LAYER_SETS >= 16);
});

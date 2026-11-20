/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { nearestLayerWith } = require("../src/components/map/engine/reveal-layer.ts");

const frame = (layer, has) => ({ layer, subset: has });

test("여러 겹에 있으면 가장 깊은 겹을 고른다 — 필요한 만큼만 올라간다", () => {
  const frames = [frame(0, [0, 0, 1]), frame(1, [0, 0, 0]), frame(2, [0, 0, 1])];
  assert.equal(nearestLayerWith(frames, 2), 2);
});

test("한 겹에만 있으면 그 겹이다", () => {
  assert.equal(nearestLayerWith([frame(0, [1]), frame(1, [0])], 0), 0);
});

test("어느 겹에도 없으면 null 이다", () => {
  assert.equal(nearestLayerWith([frame(0, [0]), frame(1, [0])], 0), null);
});

test("파고든 적이 없으면 볼 프레임이 없다", () => {
  assert.equal(nearestLayerWith([], 0), null);
});

test("마스크가 색인보다 짧으면 없는 것으로 읽는다", () => {
  assert.equal(nearestLayerWith([frame(0, [1, 1])], 7), null);
});

test("프레임 순서가 뒤섞여도 답이 같다", () => {
  const shuffled = [frame(2, [1]), frame(0, [1]), frame(1, [0])];
  assert.equal(nearestLayerWith(shuffled, 0), 2);
});

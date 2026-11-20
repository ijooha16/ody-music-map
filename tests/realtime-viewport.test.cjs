/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { toViewportRequest } = require("../src/hooks/use-viewport-subscription.ts");

const box = (layer, xMin, xMax, yMin, yMax) => ({ layer, xMin, xMax, yMin, yMax });

test("레이어 0 이면 ancestorBounds 는 빈 배열이다 — layer 는 boxes 길이다", () => {
  const r = toViewportRequest(1, [], box(0, -5, 4, -3, 6));
  assert.equal(r.layer, 0);
  assert.deepEqual(r.ancestorBounds, []);
  assert.deepEqual([r.minX, r.maxX, r.minY, r.maxY], [-5, 4, -3, 6]);
});

test("ancestorBounds 는 boxes 를 순서대로 옮긴다 — bounds[i].layer === i", () => {
  const boxes = [box(0, -5, 4, -3, 6), box(1, -1, 2.5, -2, 1.1)];
  const r = toViewportRequest(7, boxes, box(2, -2.15, 1.8, -0.9, 3.42));
  assert.equal(r.layer, 2, "layer 는 boxes.length 다 — +1 하지 않는다");
  assert.equal(r.ancestorBounds.length, 2);
  r.ancestorBounds.forEach((b, i) => assert.equal(b.layer, i));
  assert.deepEqual(r.ancestorBounds[1], { layer: 1, minX: -1, maxX: 2.5, minY: -2, maxY: 1.1 });
});

test("requestSeq 는 준 값을 그대로 쓴다 — join 카운터와 섞이면 안 된다", () => {
  assert.equal(toViewportRequest(42, [], box(0, 0, 1, 0, 1)).requestSeq, 42);
});
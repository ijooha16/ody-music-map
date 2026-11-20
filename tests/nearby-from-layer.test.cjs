/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { distanceBetween, distanceFrom, nearestFirst, radiusFromNeighbors, withinRadius } = require("../src/lib/nearby-from-layer.ts");

test("두 점 사이 거리", () => {
  assert.equal(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(distanceBetween({ x: 1, y: 1 }, { x: 1, y: 1 }), 0);
});

test("잴 수 없으면 맨 뒤로 보낸다", () => {
  assert.equal(distanceFrom(null, { x: 1, y: 1 }), Number.POSITIVE_INFINITY);
  assert.equal(distanceFrom({ x: 0, y: 0 }, null), Number.POSITIVE_INFINITY);
  assert.equal(distanceFrom(null, null), Number.POSITIVE_INFINITY);
});

test("잴 수 있으면 그대로 잰다", () => {
  assert.equal(distanceFrom({ x: 0, y: 0 }, { x: 0, y: 2 }), 2);

  assert.equal(distanceFrom({ x: 5, y: -3 }, { x: 5, y: -3 }), 0);
});

const person = (email, distance) => ({ email, distance });

test("가까운 순으로 정렬한다", () => {
  const out = nearestFirst([person("c", 3), person("a", 1), person("b", 2)], 10);
  assert.deepEqual(
    out.map((p) => p.email),
    ["a", "b", "c"],
  );
});

test("상한까지만 남긴다 — 먼 사람이 먼저 잘린다", () => {
  const out = nearestFirst([person("far", 9), person("near", 1), person("mid", 5)], 2);
  assert.deepEqual(
    out.map((p) => p.email),
    ["near", "mid"],
  );
});

test("잴 수 없던 사람은 상한에서 먼저 잘린다", () => {
  const out = nearestFirst([person("unknown", Number.POSITIVE_INFINITY), person("near", 1)], 1);
  assert.deepEqual(
    out.map((p) => p.email),
    ["near"],
  );
});

test("상한이 사람 수보다 크면 다 남는다", () => {
  assert.equal(nearestFirst([person("a", 1), person("b", 2)], 12).length, 2);
});

test("상한이 0 이하면 아무도 안 남는다", () => {
  assert.deepEqual(nearestFirst([person("a", 1)], 0), []);
});

test("넘겨받은 배열을 제자리에서 정렬하지 않는다", () => {
  const input = [person("c", 3), person("a", 1)];
  nearestFirst(input, 10);
  assert.equal(input[0].email, "c");
});

test("내 곡에서 k 번째로 가까운 곡까지가 경계다", () => {
  assert.equal(radiusFromNeighbors([5, 1, 3, 2, 4], 3), 3);
  assert.equal(radiusFromNeighbors([5, 1, 3, 2, 4], 1), 1);
});

test("곡이 k 개보다 적으면 있는 것 중 제일 먼 곡까지다", () => {
  assert.equal(radiusFromNeighbors([2, 1], 80), 2);
});

test("곡이 하나도 없으면 0 — 아무도 안 들어온다", () => {
  assert.equal(radiusFromNeighbors([], 80), 0);
  assert.deepEqual(withinRadius([person("a", 1)], 0), []);
});

test("경계 밖 사람은 뺀다 — 자리가 남아도 안 채운다", () => {
  const out = withinRadius([person("near", 1), person("far", 100)], 10);
  assert.deepEqual(
    out.map((p) => p.email),
    ["near"],
  );
});

test("경계 위에 딱 걸치면 넣는다", () => {
  assert.equal(withinRadius([person("edge", 10)], 10).length, 1);
});

test("가까이 아무도 없으면 빈 목록 — 그게 사실이다", () => {
  assert.deepEqual(withinRadius([person("far", 999)], 10), []);
});

test("경계를 모르면 아무도 안 넣는다", () => {
  assert.deepEqual(withinRadius([person("a", 1)], null), []);
});

test("잴 수 없던 사람은 경계에서 걸러진다", () => {
  assert.deepEqual(withinRadius([person("unknown", Number.POSITIVE_INFINITY)], 10), []);
});

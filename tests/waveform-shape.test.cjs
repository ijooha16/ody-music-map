/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { shapeFor, barHeight, MIN_H, MAX_H } = require("../src/components/player/waveform-bars.tsx");

const SEEDS = [0, 1, 7, 42, 1234, 99999, 777777];
const all = SEEDS.flatMap((s) => shapeFor(s));

test("모든 바가 바닥과 상한 사이에 있다", () => {
  assert.equal(Math.min(...all) >= Math.round(MIN_H * 100), true);
  assert.equal(Math.max(...all) <= Math.round(MAX_H * 100), true);
});

test("가장 높은 바가 1.5배로 흔들려도 상자를 넘지 않는다", () => {
  assert.equal(Math.max(...all) * 1.5 <= 100, true);
});

test("같은 곡은 항상 같은 모양이다 — 새로고침해도 안 바뀐다", () => {
  assert.deepEqual(shapeFor(42), shapeFor(42));
  assert.notDeepEqual(shapeFor(42), shapeFor(43));
});

test("높이가 한 덩어리에 몰려 있지 않다 — 낮은 바와 높은 바가 갈라진다", () => {
  const sorted = [...all].sort((a, b) => a - b);
  const q = (p) => sorted[Math.floor(p * (sorted.length - 1))];

  assert.equal(q(0.75) - q(0.25) > 18, true);

  assert.equal(q(0.02) < 15, true);
});

test("지나온 바는 제 높이로 서 있고 안 지나간 바는 눕는다", () => {
  const h = 60;
  const head = 30;

  assert.equal(barHeight(h, 0, head, true), h);
  assert.equal(barHeight(h, head - 1, head, true), h);

  assert.equal(barHeight(h, head + 20, head, true) < h, true);
});

test("멈춰 있어도 지나온 구간은 서 있다 — 자취는 재생 여부와 상관없다", () => {
  const h = 60;
  assert.equal(barHeight(h, 5, 30, false), h);
  assert.equal(barHeight(h, 50, 30, false) < h, true);
});

/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MapEngine } = require("../src/components/map/engine/map-engine.ts");
const { PROBE, CONSTELLATION } = require("../src/constants/map.ts");

const ONE = { top: 153, right: 0, bottom: 253, left: 0 };

const TWO = { ...ONE, bottom: 253 + 136 };

function phone(W = 360, H = 780) {
  const e = new MapEngine();
  e.W = W;
  e.H = H;
  e.setOcclusion(ONE, "now");
  return e;
}

const settledProbe = () => ({ exitingAt: null, rings: [{ t0: performance.now() - PROBE.enterMs - 1000 }] });

test("폰: 주변 탐색 중에 시트를 2단으로 올려도 고리가 쓰는 화면은 그대로다", () => {
  const e = phone();
  e.probe = settledProbe();
  assert.equal(e.overlayRect().y1, 780 - 253);
  e.setOcclusion(TWO, "now");
  assert.equal(e.freeRect().y1, 780 - 253 - 136, "지도 자체의 남은 화면은 줄어든다");
  assert.equal(e.overlayRect().y1, 780 - 253, "고리는 뷰가 뜰 때의 화면을 쓴다");
});

test("폰: 별자리도 같다", () => {
  const e = phone();
  e.constellation = { t0: performance.now() - CONSTELLATION.enterMs - 1000, exitingAt: null };
  const before = e.overlayRect();
  e.setOcclusion(TWO, "now");
  assert.deepEqual(e.overlayRect(), before);
});

test("폰: 들어오는 동안에는 목표 가림폭을 따라간다 — 뷰를 연 손짓이 시트 단도 함께 옮긴다", () => {
  const e = phone();
  e.setOcclusion(TWO, "now");
  e.probe = { exitingAt: null, rings: [{ t0: performance.now() }] };
  assert.equal(e.overlayRect().y1, 780 - 253 - 136);

  e.setOcclusion(ONE);
  assert.equal(e.overlayRect().y1, 780 - 253);
});

test("폰: 화면 크기가 바뀌면 다시 잡는다", () => {
  const e = phone();
  e.probe = settledProbe();
  e.overlayRect();
  e.setOcclusion(TWO, "now");
  e.W = 390;
  e.H = 844;
  assert.equal(e.overlayRect().y1, 844 - 253 - 136);
});

test("폰: 뷰가 끝나면 붙잡은 것을 놓는다 — 다음 뷰는 그때의 화면으로 뜬다", () => {
  const e = phone();
  e.probe = settledProbe();
  e.overlayRect();
  e.probe = null;
  e.setOcclusion(TWO, "now");
  assert.equal(e.overlayRect().y1, e.freeRect().y1);
  e.constellation = { t0: performance.now() - CONSTELLATION.enterMs - 1000, exitingAt: null };
  assert.equal(e.overlayRect().y1, 780 - 253 - 136);
});

test("넓은 화면은 그대로 따라간다 — 우측 패널이 열리면 별자리가 좁아지는 것이 맞다", () => {
  const e = phone(1280, 800);
  e.setOcclusion({ top: 58, right: 0, bottom: 92, left: 0 }, "now");
  e.probe = settledProbe();
  e.overlayRect();
  e.setOcclusion({ right: 410 }, "now");
  assert.equal(e.overlayRect().x1, 1280 - 410);
});

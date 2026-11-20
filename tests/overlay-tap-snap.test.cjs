/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { overlayTapSnap } = require("../src/lib/overlay-tap-snap.ts");

const phone = (viewMode, activePanel, snap) => overlayTapSnap({ narrow: true, viewMode, activePanel, snap });

test("주변 탐색·별자리에서 1단 시트면 1단 그대로다", () => {
  assert.equal(phone("nearby", "song", 1), 1);
  assert.equal(phone("constellation", "journey", 1), 1);
});

test("올려 둔 채 누르면 그 단 그대로다 — 곡 정보를 보려고 올린 것을 내리지 않는다", () => {
  assert.equal(phone("nearby", "song", 2), 2);
  assert.equal(phone("constellation", "song", 3), 3);
});

test("열린 시트가 없으면 1단으로 연다", () => {
  assert.equal(phone("nearby", null, 2), 1, "닫힌 뒤 스토어의 단은 2 로 남아 있다");
});

test("기본 지도는 여는 쪽 기본값(2단)을 쓴다 — 703 그대로", () => {
  assert.equal(phone("default", "song", 1), undefined);
  assert.equal(phone("default", null, 2), undefined);
});

test("넓은 화면은 건드리지 않는다", () => {
  assert.equal(overlayTapSnap({ narrow: false, viewMode: "nearby", activePanel: "song", snap: 1 }), undefined);
});

/* eslint-disable @typescript-eslint/no-require-imports */

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

let panel;

beforeEach(() => {
  const values = new Map();
  const storage = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) };
  global.window = { localStorage: storage, sessionStorage: { ...storage, removeItem: () => {} } };
  ({ usePanelStore: panel } = require("../src/stores/use-panel-store.ts"));
  panel.setState(panel.getInitialState(), true);
});
afterEach(() => {
  delete global.window;
});

test("단을 안 주면 여는 자리(2 단)에 선다 — 레일·재생바는 그대로다", () => {
  panel.getState().toggle("journey");
  assert.equal(panel.getState().activePanel, "journey");
  assert.equal(panel.getState().snap, 2);

  panel.getState().close();
  panel.getState().openJourney();
  assert.equal(panel.getState().snap, 2);
});

test("폰 윗줄 여정 버튼은 1 단으로 연다", () => {
  panel.getState().toggle("journey", 1);
  assert.equal(panel.getState().activePanel, "journey");
  assert.equal(panel.getState().snap, 1);
});

test("경로 만들기 뒤 폰은 1 단으로 연다", () => {
  panel.getState().openJourney(1);
  assert.equal(panel.getState().activePanel, "journey");
  assert.equal(panel.getState().snap, 1);
});

test("다른 패널이 3 단으로 떠 있어도 1 단으로 갈아탄다", () => {
  panel.getState().openChart();
  panel.getState().setSnap(3);
  panel.getState().toggle("journey", 1);
  assert.equal(panel.getState().activePanel, "journey");
  assert.equal(panel.getState().snap, 1);
});

test("이미 떠 있는 패널을 다시 누르면 단과 상관없이 닫힌다", () => {
  panel.getState().toggle("journey", 1);
  panel.getState().toggle("journey", 1);
  assert.equal(panel.getState().activePanel, null);
});

test("프로필 토글도 단을 받는다 — 내 프로필로 연다", () => {
  panel.getState().toggle("feed", 1);
  assert.equal(panel.getState().activePanel, "feed");
  assert.equal(panel.getState().profileEmail, null);
  assert.equal(panel.getState().snap, 1);
});

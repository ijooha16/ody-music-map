/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { acceptsAnchor } = require("../src/components/map/engine/stale-anchor.ts");

test("날아가는 중이 아니면 서버가 준 자리를 그대로 받는다", () => {
  assert.equal(acceptsAnchor(null, 100), true);
  assert.equal(acceptsAnchor(null, 999), true);
});

test("날아가는 중이면 그 목적지와 같을 때만 받는다", () => {
  assert.equal(acceptsAnchor(200, 200), true, "도착 확인은 받는다");
  assert.equal(acceptsAnchor(200, 100), false, "직전 곡을 실어 온 옛 답은 버린다");
});

test("비행이 끝난 뒤에는 무엇이 와도 받는다", () => {
  assert.equal(acceptsAnchor(null, 100), true);
});

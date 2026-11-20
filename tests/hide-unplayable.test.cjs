/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { useUnplayableStore } = require("../src/stores/use-unplayable-store.ts");

test("표시하면 집합에 담기고, 같은 곡을 또 표시해도 참조가 안 바뀐다", () => {
  const { markUnplayable } = useUnplayableStore.getState();
  markUnplayable(42);
  const first = useUnplayableStore.getState().ids;
  assert.equal(first.has(42), true);

  markUnplayable(42);
  assert.equal(useUnplayableStore.getState().ids, first, "같은 곡을 또 표시하면 구독자를 깨우지 않는다");

  markUnplayable(43);
  assert.notEqual(useUnplayableStore.getState().ids, first, "새 곡이면 새 집합이라 화면이 다시 걸러진다");
  assert.equal(useUnplayableStore.getState().ids.has(42), true, "먼저 담은 곡이 사라지면 안 된다");
});

/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { useMapCoverStore } = require("../src/stores/use-map-cover-store.ts");

const covers = () => useMapCoverStore.getState().covers;
const reset = () => useMapCoverStore.setState({ covers: 0 });

test("탭 화면을 옮겨 다닐 때 새 화면이 먼저 붙어도 덮인 채로 남는다", () => {
  reset();
  const { cover, uncover } = useMapCoverStore.getState();
  cover();
  cover();
  uncover();
  assert.equal(covers(), 1, "마이페이지가 아직 덮고 있다");
  uncover();
  assert.equal(covers(), 0);
});

test("떼는 쪽이 더 많아도 음수로 내려가지 않는다", () => {
  reset();
  useMapCoverStore.getState().uncover();
  assert.equal(covers(), 0);
  useMapCoverStore.getState().cover();
  assert.equal(covers(), 1, "음수에 갇히지 않고 한 번 덮으면 바로 덮인 것으로 읽힌다");
});

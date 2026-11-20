/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { shouldRestartFollow } = require("../src/components/map/engine/follow-restart.ts");

const here = { email: "a@x.com", layer: 0 };

test("아직 아무도 안 따라가면 건다", () => {
  assert.equal(shouldRestartFollow(null, here), true);
});

test("같은 사람을 같은 겹에서 따라가는 중이면 다시 걸지 않는다", () => {
  assert.equal(shouldRestartFollow(here, { ...here }), false);
});

test("사람이 바뀌면 다시 건다", () => {
  assert.equal(shouldRestartFollow(here, { email: "b@x.com", layer: 0 }), true);
});

test("겹이 바뀌면 다시 건다 — 좌표계가 겹마다 다르다", () => {
  assert.equal(shouldRestartFollow(here, { email: "a@x.com", layer: 1 }), true);
});

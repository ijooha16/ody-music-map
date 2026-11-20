/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { canRideOptimistically } = require("../src/lib/realtime/ride-optimistic.ts");

test("아무도 안 따라가는 중이면 먼저 세운다", () => {
  assert.equal(canRideOptimistically({ ridingEmail: null, targetEmail: "a@ody.kr", silent: false }), true);
});

test("남을 따라가는 중이면 먼저 세우지 않는다", () => {
  assert.equal(canRideOptimistically({ ridingEmail: "a@ody.kr", targetEmail: "b@ody.kr", silent: false }), false);
});

test("같은 사람을 다시 누르는 것은 먼저 세워도 된다", () => {
  assert.equal(canRideOptimistically({ ridingEmail: "a@ody.kr", targetEmail: "a@ody.kr", silent: false }), true);
});

test("다시 잇기는 확정 전에 화면을 세우지 않는다", () => {
  assert.equal(canRideOptimistically({ ridingEmail: null, targetEmail: "a@ody.kr", silent: true }), false);
  assert.equal(canRideOptimistically({ ridingEmail: "a@ody.kr", targetEmail: "a@ody.kr", silent: true }), false);
});

const { useFollowStore } = require("../src/stores/use-follow-store.ts");

test("인솔자 곡 좌표가 뒤늦게 들어오면 따라가기 효과를 다시 돌릴 계기가 생긴다", () => {
  const before = useFollowStore.getState().pointRevision;
  useFollowStore.getState().markPointAdopted();
  assert.equal(useFollowStore.getState().pointRevision, before + 1);
});

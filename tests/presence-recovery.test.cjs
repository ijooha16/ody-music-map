/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { recoveryFor } = require("../src/lib/realtime/presence-recovery.ts");

test("presence 행이 없으면 재입장이 아니라 소켓 재연결이다", () => {
  assert.equal(recoveryFor("PRESENCE_NOT_CONNECTED"), "reconnect");
  assert.notEqual(
    recoveryFor("PRESENCE_NOT_CONNECTED"),
    "rejoin",
    "join 으로는 못 고친다 — presence 행을 만드는 것은 소켓 CONNECT 뿐이다",
  );
});

test("자리가 어긋난 것뿐이면 재입장으로 맞춘다", () => {
  assert.equal(recoveryFor("PRESENCE_STALE"), "rejoin");
});

test("재생 기록이 없는 것은 복구 대상이 아니다", () => {
  assert.equal(recoveryFor("PRESENCE_NO_ANCHOR"), "none");
});

test("모르는 코드는 아무것도 하지 않는다", () => {
  for (const code of ["PRESENCE_LAYER_INVALID", "PRESENCE_LOCATION_NULL", "RIDE_FULL", "VIEWPORT_INVALID"]) {
    assert.equal(recoveryFor(code), "none", `${code} 에 복구가 붙으면 엉뚱한 곳에서 소켓이 끊긴다`);
  }
});

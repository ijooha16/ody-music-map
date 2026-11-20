/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { authHeader } = require("../src/lib/backend.ts");

const SERVICE = "svc-token";
const CALLER = "Bearer caller-token";

test("호출자 토큰이 있으면 그것을 쓴다 — 서비스 토큰이 있어도", () => {
  assert.deepEqual(authHeader(CALLER, SERVICE), { Authorization: CALLER });
});

test("호출자 토큰이 없으면 서비스 토큰으로 떨어진다 — 예전 동작", () => {
  assert.deepEqual(authHeader(null, SERVICE), { Authorization: `Bearer ${SERVICE}` });
  assert.deepEqual(authHeader(undefined, SERVICE), { Authorization: `Bearer ${SERVICE}` });

  assert.deepEqual(authHeader("", SERVICE), { Authorization: `Bearer ${SERVICE}` });
});

test("둘 다 없으면 헤더를 안 붙인다 — A-17 해제 중에는 그래도 조회가 된다", () => {
  assert.deepEqual(authHeader(null, undefined), {});
});

test("호출자 토큰에 Bearer 를 덧붙이지 않는다 — 브라우저가 이미 붙여 보낸다", () => {
  assert.equal(authHeader(CALLER, SERVICE).Authorization, "Bearer caller-token");
  assert.ok(!authHeader(CALLER, SERVICE).Authorization.startsWith("Bearer Bearer"));
});

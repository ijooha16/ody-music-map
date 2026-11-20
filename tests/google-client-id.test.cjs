/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { resolveGoogleClientId, GOOGLE_CLIENT_ID } = require("../src/constants/auth.ts");

test("환경변수가 없으면 코드 기본값으로 떨어진다 — 배포 빌드가 빈 값이 되지 않게", () => {
  assert.match(resolveGoogleClientId(undefined), /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
});

test("빈 문자열도 없음으로 본다 — 번들에 undefined 로 박히는지 빈 값으로 박히는지에 기대지 않는다", () => {
  assert.equal(resolveGoogleClientId(""), resolveGoogleClientId(undefined));
});

test("환경변수를 주면 그것이 기본값을 이긴다 — 다른 구글 프로젝트를 쓰는 사람이 덮어쓴다", () => {
  assert.equal(resolveGoogleClientId("other-client.apps.googleusercontent.com"), "other-client.apps.googleusercontent.com");
});

test("모듈이 내보내는 값도 비어 있지 않다 — 로그인 화면이 이 값으로 버튼을 가른다", () => {
  assert.ok(GOOGLE_CLIENT_ID.length > 0);
  assert.match(GOOGLE_CLIENT_ID, /\.apps\.googleusercontent\.com$/);
});

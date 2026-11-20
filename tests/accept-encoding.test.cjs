/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { acceptsGzip } = require("../src/lib/accept-encoding.ts");

test("브라우저가 보내는 흔한 값은 gzip 을 받는다", () => {
  assert.equal(acceptsGzip("gzip, deflate, br, zstd"), true);
  assert.equal(acceptsGzip("gzip"), true);
  assert.equal(acceptsGzip("br;q=1.0, gzip;q=0.8, *;q=0.1"), true);
});

test("헤더가 없거나 gzip 이 없으면 원본을 보낸다", () => {
  assert.equal(acceptsGzip(null), false);
  assert.equal(acceptsGzip(undefined), false);
  assert.equal(acceptsGzip(""), false);
  assert.equal(acceptsGzip("br, deflate"), false);
  assert.equal(acceptsGzip("identity"), false);
});

test("q=0 은 거절이다 — * 가 있어도 gzip 을 이름으로 거절했으면 그쪽이 이긴다", () => {
  assert.equal(acceptsGzip("gzip;q=0"), false);
  assert.equal(acceptsGzip("gzip; q=0.0, deflate"), false);
  assert.equal(acceptsGzip("*;q=0.5, gzip;q=0"), false);
});

test("* 는 아무 인코딩이나 받는다는 뜻이라 gzip 도 된다", () => {
  assert.equal(acceptsGzip("*"), true);
  assert.equal(acceptsGzip("br, *;q=0.1"), true);
  assert.equal(acceptsGzip("*;q=0"), false);
});

test("대소문자와 공백은 가리지 않는다", () => {
  assert.equal(acceptsGzip("  GZIP , Deflate"), true);
});

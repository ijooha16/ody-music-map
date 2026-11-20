/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { PATCH } = require("../src/app/bff/user/image/route.ts");

let upstreamCalls = 0;
globalThis.fetch = async () => {
  upstreamCalls += 1;
  throw new TypeError("업스트림은 이 테스트에서 부르지 않는다");
};

const upload = (file) => {
  const form = new FormData();
  if (file) form.append("file", file, file.name);
  return new Request("http://localhost/bff/user/image", { method: "PATCH", body: form });
};
const imageOf = (bytes, type = "image/png", name = "me.png") => new File([new Uint8Array(bytes)], name, { type });
const codeOf = async (res) => (await res.json()).error?.code;

test("이미지가 아니면 올리지 않는다", async () => {
  upstreamCalls = 0;
  const res = await PATCH(upload(imageOf(10, "application/pdf", "resume.pdf")));
  assert.equal(res.status, 400);
  assert.equal(await codeOf(res), "UNSUPPORTED_FILE_TYPE");
  assert.equal(upstreamCalls, 0, "검사에서 막혔으면 백엔드까지 가지 않는다");
});

test("5MB 를 넘으면 올리지 않는다", async () => {
  upstreamCalls = 0;
  const res = await PATCH(upload(imageOf(5 * 1024 * 1024 + 1)));
  assert.equal(res.status, 400);
  assert.equal(await codeOf(res), "FILE_TOO_LARGE");
  assert.equal(upstreamCalls, 0);
});

test("파일이 없거나 비어 있으면 고르라고 답한다", async () => {
  assert.equal(await codeOf(await PATCH(upload(null))), "VALIDATION_ERROR");
  assert.equal(await codeOf(await PATCH(upload(imageOf(0)))), "VALIDATION_ERROR");
});

test("경계값은 통과시킨다 — 정확히 5MB 인 이미지는 막지 않는다", async () => {
  upstreamCalls = 0;
  await PATCH(upload(imageOf(5 * 1024 * 1024)));

  assert.equal(upstreamCalls, 1);
});

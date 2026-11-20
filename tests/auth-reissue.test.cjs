/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");

function memStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}
globalThis.window = { localStorage: memStorage(), sessionStorage: memStorage() };

const { api } = require("../src/lib/api.ts");
const { readStorage, writeStorage, removeStorage, resyncStorage, subscribeStorage } = require("../src/lib/storage.ts");
const { STORAGE_KEYS, API_ENDPOINTS } = require("../src/constants/index.ts");

const TOKEN = STORAGE_KEYS.accessToken;
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const unauthorized = () => json(401, { success: false, error: { code: "UNAUTHORIZED", message: "만료" } });

function stubFetch(onReissue) {
  const calls = [];
  globalThis.fetch = async (url) => {
    const path = String(url);
    calls.push(path);
    if (path.includes(API_ENDPOINTS.auth.reissue)) return onReissue();
    return unauthorized();
  };
  return calls;
}

test("재발급이 401 로 끝나면 죽은 토큰을 지운다", async () => {
  writeStorage(TOKEN, "expired-token");
  const calls = stubFetch(() => unauthorized());

  await assert.rejects(() => api(API_ENDPOINTS.auth.me));

  assert.ok(calls.some((c) => c.includes(API_ENDPOINTS.auth.reissue)));

  assert.equal(readStorage(TOKEN), null);
});

test("네트워크가 끊겨 재발급을 못 보낸 것이면 토큰을 지킨다", async () => {
  writeStorage(TOKEN, "maybe-alive");
  stubFetch(() => {
    throw new TypeError("Failed to fetch");
  });

  await assert.rejects(() => api(API_ENDPOINTS.auth.me));

  assert.equal(readStorage(TOKEN), "maybe-alive");
});

test("토큰이 지워지면 구독자가 그 자리에서 듣는다", () => {
  writeStorage(TOKEN, "alive");
  let heard = 0;
  const unsubscribe = subscribeStorage(() => (heard += 1));

  writeStorage(TOKEN, "renewed");
  assert.equal(heard, 1);

  unsubscribe();
  writeStorage(TOKEN, "again");
  assert.equal(heard, 1, "구독을 끊었으면 더 듣지 않는다");
});

test("재발급 도중에 로그아웃했으면 새 토큰을 쓰지 않는다", async () => {
  await new Promise((r) => setTimeout(r, 0));
  writeStorage(TOKEN, "expired-token");
  stubFetch(async () => {
    removeStorage(TOKEN);
    return json(200, { success: true, data: { accessToken: "revived" }, error: null });
  });

  await assert.rejects(() => api(API_ENDPOINTS.auth.me));

  assert.equal(readStorage(TOKEN), null, "로그아웃한 세션이 재발급으로 되살아나면 안 된다");
});

test("로그아웃하지 않았으면 새 토큰을 그대로 받는다", async () => {
  await new Promise((r) => setTimeout(r, 0));
  writeStorage(TOKEN, "expired-token");
  stubFetch(async () => json(200, { success: true, data: { accessToken: "revived" }, error: null }));

  await assert.rejects(() => api(API_ENDPOINTS.auth.me));

  assert.equal(readStorage(TOKEN), "revived");
});

test("resyncStorage 는 값을 안 바꾸고 구독자만 깨운다", () => {
  writeStorage(TOKEN, "alive");
  let heard = 0;
  const unsubscribe = subscribeStorage(() => (heard += 1));

  resyncStorage();
  assert.equal(heard, 1, "구독자가 다시 읽을 기회를 받아야 한다");
  assert.equal(readStorage(TOKEN), "alive", "저장소는 그대로여야 한다");

  unsubscribe();
});

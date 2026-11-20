/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const { devModeScript } = require("../src/constants/dev-mode.ts");
const { STORAGE_KEYS } = require("../src/constants/storage-keys.ts");

const KEY = STORAGE_KEYS.surveyMode;
const ANALYTICS = STORAGE_KEYS.analyticsMode;

function makeStorage(initial = {}, blocked = false) {
  const values = new Map(Object.entries(initial));
  const guard = () => {
    if (blocked) throw new Error("blocked");
  };
  return {
    values,
    getItem: (k) => (guard(), values.get(k) ?? null),
    setItem: (k, v) => (guard(), values.set(k, v), undefined),
    removeItem: (k) => (guard(), values.delete(k), undefined),
  };
}

function run({ url = "https://ody.test/", local = {}, session = {}, blocked = false } = {}) {
  const classes = new Set();
  const replaced = [];
  const context = {
    URL,
    URLSearchParams,
    location: { href: url },
    localStorage: makeStorage(local, blocked),
    sessionStorage: makeStorage(session, blocked),
    history: { replaceState: (_s, _t, next) => replaced.push(next) },
    document: {
      documentElement: {
        classList: {
          toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
        },
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(devModeScript, context);
  return {
    classes,
    local: context.localStorage.values,
    session: context.sessionStorage.values,
    url: replaced.at(-1) ?? null,
  };
}

test("?dev=1 이면 설문이 꺼진다", () => {
  assert.equal(run({ url: "https://ody.test/?dev=1" }).local.get(KEY), "false");
});

test("<html> 에 아무 클래스도 안 붙인다 — 게이트가 없어졌다", () => {
  assert.equal(run({ url: "https://ody.test/?dev=1" }).classes.size, 0);
  assert.equal(run({ url: "https://ody.test/" }).classes.size, 0);
});

test("?dev=1 이면 이 브라우저의 분석 전송이 멈춘다", () => {
  assert.equal(run({ url: "https://ody.test/?dev=1" }).local.get(ANALYTICS), "false");
});

test("?dev=0 이면 분석이 다시 켜진다 — 껐다면 되돌릴 수도 있어야 한다", () => {
  const r = run({ url: "https://ody.test/?dev=0", local: { [ANALYTICS]: "false" } });
  assert.equal(r.local.has(ANALYTICS), false);
});

test("?dev=0 은 테스터가 보는 상태로 — 설문을 켜고 분석은 다시 보낸다", () => {
  const r = run({ url: "https://ody.test/?dev=0", local: { [KEY]: "false", [ANALYTICS]: "false" } });

  assert.equal(r.local.get(KEY), "true");
  assert.equal(r.local.has(ANALYTICS), false);
});

test("파라미터를 주소에서 지운다 — 링크를 다시 보낼 때 딸려가지 않게", () => {
  assert.equal(run({ url: "https://ody.test/?dev=1" }).url, "/");

  assert.equal(run({ url: "https://ody.test/map?dev=1&q=abc#top" }).url, "/map?q=abc#top");
});

test("파라미터 없이 다시 들어와도 유지된다 — 폰에서 한 번만 치면 된다", () => {
  const r = run({ url: "https://ody.test/", local: { [KEY]: "false" } });
  assert.equal(r.local.get(KEY), "false", "손대지 않는다");
  assert.equal(r.url, null, "주소를 안 건드린다");
});

test("손댄 적 없으면 아무 일도 안 한다 — 기본값(설문 꺼짐) 그대로", () => {
  const r = run({ url: "https://ody.test/" });
  assert.equal(r.local.size, 0);
  assert.equal(r.url, null);
});

test("session 에 남은 옛 값을 지운다 — 읽는 순서 때문에 살아나지 않게", () => {
  const r = run({ url: "https://ody.test/?dev=1", session: { [KEY]: "true" } });
  assert.equal(r.session.has(KEY), false);
  assert.equal(r.local.get(KEY), "false");
});

test("저장소가 막혀 있어도 안 죽는다 — 시크릿 모드에서 앱이 뜨기 전에 터지면 안 된다", () => {
  assert.doesNotThrow(() => run({ url: "https://ody.test/?dev=1", blocked: true }));
});

test("gate 파라미터는 더 이상 아무 일도 안 한다", () => {
  const r = run({ url: "https://ody.test/?gate=1" });
  assert.equal(r.local.size, 0, "저장소를 안 건드린다");
  assert.equal(r.url, null, "모르는 파라미터는 주소에 그대로 둔다");
});

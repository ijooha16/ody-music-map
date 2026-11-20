/* eslint-disable @typescript-eslint/no-require-imports */

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const KEY = "ody:survey-mode";
let values;

function loadFresh(testTools) {
  for (const file of ["src/hooks/use-survey-mode.ts", "src/constants/test-tools.ts"]) {
    delete require.cache[path.resolve(__dirname, "..", file)];
  }
  if (testTools === undefined) delete process.env.NEXT_PUBLIC_TEST_TOOLS;
  else process.env.NEXT_PUBLIC_TEST_TOOLS = testTools;
  return require("../src/hooks/use-survey-mode.ts");
}

beforeEach(() => {
  values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  global.window = { localStorage: storage, sessionStorage: { ...storage, removeItem: () => {} } };
});
afterEach(() => {
  delete global.window;
  delete process.env.NEXT_PUBLIC_TEST_TOOLS;
});

test("값이 없으면 꺼져 있다 — 기본은 개발 버전이다", () => {
  assert.equal(loadFresh().surveyModeEnabled(), false);
});

test('"true" 면 켜지고 "false" 로 다시 꺼진다', () => {
  const { surveyModeEnabled } = loadFresh();
  values.set(KEY, "true");
  assert.equal(surveyModeEnabled(), true);
  values.set(KEY, "false");
  assert.equal(surveyModeEnabled(), false);
});

test("빌드 스위치가 이긴다 — TEST_TOOLS=0 이면 로컬 값으로 못 켠다", () => {
  const { surveyModeEnabled } = loadFresh("0");
  assert.equal(surveyModeEnabled(), false);
  values.set(KEY, "true");
  assert.equal(surveyModeEnabled(), false);
});

test("망가진 값·막힌 저장소는 기본값(꺼짐)으로 떨어진다", () => {
  const { surveyModeEnabled } = loadFresh();
  values.set(KEY, "부서진 값");
  assert.equal(surveyModeEnabled(), false);
  window.localStorage.getItem = () => {
    throw new Error("blocked");
  };
  window.sessionStorage.getItem = () => {
    throw new Error("blocked");
  };
  assert.equal(surveyModeEnabled(), false);
});

test("서버에서는 꺼져 있다 — 하이드레이션 첫 렌더가 서버와 같아야 한다", () => {
  delete global.window;
  assert.equal(loadFresh().surveyModeEnabled(), false);
  assert.equal(loadFresh("0").surveyModeEnabled(), false);
});

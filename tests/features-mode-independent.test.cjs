/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const features = require("../src/constants/features.ts");

test("기능 표는 하나다 — 설문 모드용 표가 없다", () => {
  assert.deepEqual(Object.keys(features).sort(), ["FEATURES", "PANEL_ENABLED"]);
});

const INTENTIONALLY_OFF = {
  playHint: true,
};

test("정해 둔 것 말고는 전부 켜져 있다", () => {
  for (const [k, v] of Object.entries(features.FEATURES)) {
    if (INTENTIONALLY_OFF[k]) {
      assert.equal(v, false, `${k} 는 꺼 두기로 한 것인데 켜져 있다 — 되돌렸으면 INTENTIONALLY_OFF 에서도 지운다`);
      continue;
    }
    assert.equal(v, true, `${k} 가 꺼져 있다`);
  }

  for (const [k, v] of Object.entries(features.PANEL_ENABLED)) assert.equal(v, true, `${k} 패널이 꺼져 있다`);
});

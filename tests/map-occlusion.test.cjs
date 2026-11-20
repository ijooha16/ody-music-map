/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MapEngine } = require("../src/components/map/engine/map-engine.ts");
const { HUD_OCCLUSION, OCCLUSION_EASE } = require("../src/constants/map.ts");

function engine(W = 1280, H = 860) {
  const e = new MapEngine();
  e.W = W;
  e.H = H;
  return e;
}

test("기본값은 예전 하드코딩과 같다 — 위 58 · 아래 92 · 왼쪽 0", () => {
  const f = engine().freeRect();
  assert.equal(f.x0, 0);
  assert.equal(f.y0, HUD_OCCLUSION.top);
  assert.equal(f.y1, 860 - HUD_OCCLUSION.bottom);
  assert.equal(f.x1, 1280 - 76, "우측 기본값 76 도 그대로");
});

test("우측만 주면 예전 동작과 완전히 같다 — 데스크톱 회귀", () => {
  const e = engine();
  for (const right of [64, 410]) {
    e.setOcclusion({ right });
    const f = e.freeRect();

    assert.equal(f.x0, 0);
    assert.equal(f.x1, Math.max(120, 1280 - right));
    assert.equal(f.y0, 58);
    assert.equal(f.y1, Math.max(58 + 120, 860 - 92));
    assert.equal(f.cx, (f.x0 + f.x1) / 2);
    assert.equal(f.cy, (f.y0 + f.y1) / 2);
  }
});

test("아래를 덮으면 사각형이 그만큼 위로 줄어든다 — 바텀시트가 쓸 길", () => {
  const e = engine();
  e.setOcclusion({ bottom: 400 });
  const f = e.freeRect();
  assert.equal(f.y1, 860 - 400);
  assert.equal(f.y0, 58, "위는 그대로");
  assert.equal(f.x1, 1280 - 76, "우측도 그대로 — 준 변만 바뀐다");
});

test("준 변만 바뀌고 나머지는 남는다", () => {
  const e = engine();
  e.setOcclusion({ right: 410 });
  e.setOcclusion({ bottom: 300 });
  const f = e.freeRect();
  assert.equal(f.x1, 1280 - 410);
  assert.equal(f.y1, 860 - 300);
});

test("왼쪽을 덮으면 x0 이 밀리고 가운데도 따라 옮겨간다", () => {
  const e = engine();
  e.setOcclusion({ left: 200 });
  const f = e.freeRect();
  assert.equal(f.x0, 200);
  assert.equal(f.cx, (200 + (1280 - 76)) / 2);
});

test("다 덮어도 최소 120px 는 남는다 — 뒤집히거나 0 이 되지 않는다", () => {
  const e = engine();
  e.setOcclusion({ top: 9999, right: 9999, bottom: 9999, left: 9999 });
  const f = e.freeRect();
  assert.equal(f.x1 - f.x0, 120);
  assert.equal(f.y1 - f.y0, 120);
  for (const v of [f.x0, f.y0, f.x1, f.y1, f.cx, f.cy]) assert.ok(Number.isFinite(v), `유한해야 한다: ${v}`);
});

test('"now" 는 그 프레임에 바로 반영된다 — 끄는 동안 쓰는 길', () => {
  const e = engine();
  e.inited = true;
  e.setOcclusion({ bottom: 300 }, "now");
  assert.equal(e.freeRect().y1, 860 - 300);
});

test('"ease" 는 바로 안 바뀌고 frame() 을 돌수록 목표에 다가간다', () => {
  const e = engine();
  e.inited = true;
  const before = e.freeRect().y1;
  e.setOcclusion({ bottom: 300 }, "ease");
  assert.equal(e.freeRect().y1, before, "부른 순간에는 그대로");

  let cur = HUD_OCCLUSION.bottom;
  for (let i = 0; i < 200 && Math.abs(cur - 300) >= 0.5; i++) cur += (300 - cur) * OCCLUSION_EASE;
  assert.ok(Math.abs(cur - 300) < 0.5, "충분히 돌면 목표에 붙는다");
});

test("첫 설정은 mode 와 무관하게 즉시다 — 따라갈 이전 값이 없다", () => {
  const e = engine();
  e.setOcclusion({ bottom: 300 }, "ease");
  assert.equal(e.freeRect().y1, 860 - 300);
});

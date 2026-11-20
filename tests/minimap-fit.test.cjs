/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { fromMini, minimapFit, toMini } = require("../src/lib/minimap-fit.ts");

const BOX = { x0: -13.6, x1: 14.4, y0: -10.3, y1: 20.5 };
const W = 220;
const H = 96;
const PAD = 6;

test("상자의 네 모서리가 전부 여백 안에 들어온다", () => {
  const f = minimapFit(BOX, W, H, PAD);
  for (const [x, y] of [[BOX.x0, BOX.y0], [BOX.x1, BOX.y0], [BOX.x0, BOX.y1], [BOX.x1, BOX.y1]]) {
    const p = toMini(f, x, y);
    assert.ok(p.x >= PAD - 1e-9 && p.x <= W - PAD + 1e-9, `x ${p.x}`);
    assert.ok(p.y >= PAD - 1e-9 && p.y <= H - PAD + 1e-9, `y ${p.y}`);
  }
});

test("가로세로 같은 배율이다 — 축마다 늘리면 지도와 모양이 달라진다", () => {
  const f = minimapFit(BOX, W, H, PAD);
  const a = toMini(f, 0, 0);
  const b = toMini(f, 1, 1);
  assert.ok(Math.abs(Math.abs(b.x - a.x) - Math.abs(b.y - a.y)) < 1e-9);
});

test("월드 위쪽이 미니맵 위쪽이다", () => {
  const f = minimapFit(BOX, W, H, PAD);
  assert.ok(toMini(f, 0, BOX.y1).y < toMini(f, 0, BOX.y0).y);
});

test("누른 자리를 되돌리면 그린 자리다 — 클릭이 그리기와 어긋나지 않는다", () => {
  const f = minimapFit(BOX, W, H, PAD);
  const p = toMini(f, 7.25, -3.5);
  const back = fromMini(f, p.x, p.y);
  assert.ok(Math.abs(back.x - 7.25) < 1e-9 && Math.abs(back.y + 3.5) < 1e-9);
});

test("곡이 한 점에 몰려 있어도 무한대·NaN 이 나오지 않는다", () => {
  const f = minimapFit({ x0: 2, x1: 2, y0: 3, y1: 3 }, W, H, PAD);
  const p = toMini(f, 2, 3);
  assert.ok(Number.isFinite(f.s) && Number.isFinite(p.x) && Number.isFinite(p.y));
  assert.deepEqual([p.x, p.y], [W / 2, H / 2]);
});

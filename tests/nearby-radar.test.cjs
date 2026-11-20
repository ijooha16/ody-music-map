/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { angleOf, bearingOf, radiusOf, sizeOf } = require("../src/components/panels/friends/nearby-radar.tsx");
const { RADAR } = require("../src/constants/realtime.ts");

test("가까운 사람이 안쪽, 먼 사람이 바깥이다", () => {
  assert.ok(radiusOf(0, 10) < radiusOf(5, 10));
  assert.ok(radiusOf(5, 10) < radiusOf(10, 10));

  const near = (a, b) => Math.abs(a - b) < 1e-9;
  assert.ok(near(radiusOf(0, 10), RADAR.ringMin), "가장 가까워도 가운데(나)와는 떨어져 있다");
  assert.ok(near(radiusOf(10, 10), RADAR.ringMax));
});

test("거리를 모르면(최대 0) 전부 같은 고리에 둔다 — 없는 차이를 지어내지 않는다", () => {
  assert.equal(radiusOf(0, 0), RADAR.ringMin);
});

test("만남 횟수가 전부 0이거나 전부 같으면 크기가 균일하다", () => {
  assert.equal(sizeOf(0, 0), RADAR.sizeMin, "집계가 안 오면 모두 최소 크기");
  assert.equal(sizeOf(3, 3), RADAR.sizeMax, "한 명뿐이면 그 사람이 최대값이다");
});

test("자주 마주친 사람이 크다", () => {
  assert.ok(sizeOf(1, 10) < sizeOf(5, 10));
  assert.ok(sizeOf(5, 10) < sizeOf(10, 10));
});

test("사람이 몇 명이든 고르게 나뉜다 — 간격이 전부 같다", () => {
  for (const n of [1, 2, 3, 5, 7, 10]) {
    const gaps = [];
    for (let i = 1; i < n; i++) gaps.push(angleOf(i, n) - angleOf(i - 1, n));
    const uniq = new Set(gaps.map((g) => g.toFixed(9)));
    assert.equal(uniq.size <= 1, true, `${n}명에서 간격이 갈렸다: ${[...uniq]}`);
  }
});

test("가장 먼 고리에 최대 인원이 서도 헬멧이 서로 겹치지 않는다", () => {
  const n = 10;
  const R = RADAR.size / 2;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = angleOf(i, n);

    const r = RADAR.ringMin * R;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  let min = Infinity;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) min = Math.min(min, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
  assert.ok(min > RADAR.sizeMax, `가장 가까운 두 헬멧 간격 ${min.toFixed(1)}px 가 최대 지름 ${RADAR.sizeMax}px 보다 좁다`);
});

const at = (x, y) => ({ x, y });
const ORIGIN = at(0, 0);

const screen = (a) => ({ dx: Math.cos(a), dy: Math.sin(a) });

test("지도에서 위에 있는 사람은 레이더에서도 위에 온다", () => {
  const { dx, dy } = screen(bearingOf(ORIGIN, at(0, 5)));
  assert.ok(dy < -0.99, `위가 아니라 dy=${dy.toFixed(3)}`);
  assert.ok(Math.abs(dx) < 1e-9);
});

test("지도에서 아래에 있는 사람은 레이더에서도 아래에 온다", () => {
  const { dy } = screen(bearingOf(ORIGIN, at(0, -5)));
  assert.ok(dy > 0.99, `아래가 아니라 dy=${dy.toFixed(3)}`);
});

test("좌우는 그대로다", () => {
  assert.ok(screen(bearingOf(ORIGIN, at(5, 0))).dx > 0.99, "오른쪽");
  assert.ok(screen(bearingOf(ORIGIN, at(-5, 0))).dx < -0.99, "왼쪽");
});

test("12시 기준이 angleOf 와 같다", () => {
  assert.ok(Math.abs(bearingOf(ORIGIN, at(0, 5)) - angleOf(0, 8)) < 1e-9);
});

test("같은 곡을 듣는 사람은 각도가 같다 — 한 자리에 뭉친다", () => {
  const a1 = bearingOf(at(1, 1), at(4, 5));
  const a2 = bearingOf(at(1, 1), at(4, 5));
  assert.equal(a1, a2);
});

test("자리를 모르면 방향도 없다", () => {
  assert.equal(bearingOf(null, at(1, 1)), null);
  assert.equal(bearingOf(ORIGIN, null), null);
});

const { spreadApart } = require("../src/components/panels/friends/nearby-radar.tsx");

function closest(pts) {
  let min = Infinity;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
  return min;
}

test("완전히 같은 자리에 겹친 사람들을 떼어 놓는다", () => {
  const items = Array.from({ length: 5 }, () => ({ x: 20, y: -10, d: RADAR.sizeMin }));
  const out = spreadApart(items, RADAR.size / 2);
  assert.ok(closest(out) >= RADAR.sizeMin, `아직 겹친다: ${closest(out).toFixed(1)}px`);
});

test("상한 인원이 전부 한 점에 몰려도 떼어 놓는다", () => {
  const items = Array.from({ length: 12 }, () => ({ x: 0, y: 30, d: RADAR.sizeMin }));
  const out = spreadApart(items, RADAR.size / 2);
  assert.ok(closest(out) >= RADAR.sizeMin, `아직 겹친다: ${closest(out).toFixed(1)}px`);
});

test("헬멧 크기가 다르면 큰 쪽 기준으로 벌린다", () => {
  const items = [
    { x: 0, y: 0, d: RADAR.sizeMax },
    { x: 0, y: 0, d: RADAR.sizeMax },
  ];
  const out = spreadApart(items, RADAR.size / 2);
  assert.ok(closest(out) >= RADAR.sizeMax, `큰 헬멧끼리 겹친다: ${closest(out).toFixed(1)}px`);
});

test("안 겹치면 그대로 둔다 — 방향이 뜻을 잃지 않게", () => {
  const items = [
    { x: -60, y: 0, d: RADAR.sizeMin },
    { x: 60, y: 0, d: RADAR.sizeMin },
  ];
  const out = spreadApart(items, RADAR.size / 2);
  assert.deepEqual(out, [
    { x: -60, y: 0 },
    { x: 60, y: 0 },
  ]);
});

test("같은 입력이면 같은 그림이 나온다", () => {
  const items = Array.from({ length: 6 }, () => ({ x: 10, y: 10, d: RADAR.sizeMin }));
  assert.deepEqual(spreadApart(items, RADAR.size / 2), spreadApart(items, RADAR.size / 2));
});

test("밀어내도 판 밖으로 나가지 않는다 — 잘리면 누를 수가 없다", () => {
  const R = RADAR.size / 2;
  const items = Array.from({ length: 12 }, () => ({ x: R, y: 0, d: RADAR.sizeMin }));
  for (const p of spreadApart(items, R)) {
    assert.ok(Math.hypot(p.x, p.y) <= R - RADAR.sizeMin / 2 + 1e-6, `판 밖이다: ${Math.hypot(p.x, p.y).toFixed(1)}`);
  }
});

test("원본을 건드리지 않는다", () => {
  const items = [{ x: 1, y: 2, d: RADAR.sizeMin }];
  spreadApart(items, RADAR.size / 2);
  assert.deepEqual(items[0], { x: 1, y: 2, d: RADAR.sizeMin });
});

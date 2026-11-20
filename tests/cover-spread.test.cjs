/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { gridFor, cellOf, spreadOrder } = require("../src/components/map/render/cover-spread.ts");

const RECT = { x0: 0, y0: 0, x1: 1600, y1: 900 };

test("칸 나누기는 화면 비율을 따라간다 — 가로로 길면 열이 많다", () => {
  const { cols, rows } = gridFor(20, RECT);
  assert.ok(cols > rows, `가로가 더 긴 화면인데 cols=${cols} rows=${rows}`);
  assert.ok(cols * rows >= 20, "칸이 뽑을 개수보다 적으면 애초에 다 못 펼친다");
});

test("가장자리 점도 칸 안에 들어온다 — 경계에서 배열 밖을 짚지 않는다", () => {
  const { cols, rows } = gridFor(12, RECT);
  const last = cols * rows - 1;
  assert.equal(cellOf(0, 0, RECT, cols, rows), 0);
  assert.equal(cellOf(1600, 900, RECT, cols, rows), last, "오른쪽 아래 끝");
  assert.equal(cellOf(99999, 99999, RECT, cols, rows), last, "밖으로 나가도 마지막 칸으로 붙는다");
});

test("한쪽에 몰린 후보는 서로 다른 칸부터 내주고 나머지는 뒤로 민다", () => {
  const clustered = Array.from({ length: 60 }, (_, i) => i);
  const at = (i) => ({ x: 20 + (i % 10) * 15, y: 20 + Math.floor(i / 10) * 60 });
  const { cols, rows } = gridFor(12, RECT);
  const order = spreadOrder(clustered, at, RECT, 12);

  const cells = order.map((i) => cellOf(at(i).x, at(i).y, RECT, cols, rows));
  const distinct = new Set(cells).size;
  assert.equal(new Set(cells.slice(0, distinct)).size, distinct, "앞쪽 = 칸마다 하나씩");

  assert.ok(distinct < 12, `왼쪽에만 뭉친 입력이라 칸이 12개보다 적어야 맞다 (distinct=${distinct})`);
  assert.equal(order.length, 60, "버리지는 않는다 — 모자라면 뒤엣것으로 메운다");
});

test("고루 흩뿌린 후보는 앞쪽이 화면 전체를 덮는다", () => {
  const { cols, rows } = gridFor(12, RECT);

  const pts = [];
  for (let cy = 0; cy < rows; cy++)
    for (let cx = 0; cx < cols; cx++)
      for (let k = 0; k < 2; k++) pts.push({ x: (cx + 0.3 + k * 0.2) * (1600 / cols), y: (cy + 0.5) * (900 / rows) });
  const order = spreadOrder(
    pts.map((_, i) => i),
    (i) => pts[i],
    RECT,
    12,
  );
  const head = order.slice(0, cols * rows).map((i) => cellOf(pts[i].x, pts[i].y, RECT, cols, rows));
  assert.equal(new Set(head).size, cols * rows, "모든 칸이 한 번씩 나와야 한다");
});

test("이미 커버가 선 칸은 건너뛴다 — 새 커버는 빈 쪽으로 간다", () => {
  const { cols, rows } = gridFor(12, RECT);
  const pts = [
    { x: 50, y: 50 },
    { x: 60, y: 60 },
    { x: 1500, y: 800 }, // 마지막 칸
  ];
  const at = (i) => pts[i];
  const taken = new Set([cellOf(50, 50, RECT, cols, rows)]);
  const order = spreadOrder([0, 1, 2], at, RECT, 12, taken);

  assert.deepEqual(order, [2], "이미 찬 칸의 후보는 아예 빠진다");
});

test("커버 자리는 앨범 ID 있는 곡부터, 그다음 재생수, 그다음 받은 순서", () => {
  const { byCoverPriority } = require("../src/components/map/render/cover-spread.ts");

  const songs = [
    { id: "a", album: false, w: 0 },
    { id: "b", album: true, w: 0 },
    { id: "c", album: false, w: 9 },
    { id: "d", album: true, w: 0 },
    { id: "e", album: true, w: 5 },
  ];
  const order = [...songs].sort(byCoverPriority((s) => s.album, (s) => s.w)).map((s) => s.id);

  assert.deepEqual(order, ["e", "b", "d", "c", "a"]);
  assert.ok(order.indexOf("b") < order.indexOf("c"), "재생수 9 라도 앨범 ID 없으면 뒤로 간다");
  assert.ok(order.indexOf("b") < order.indexOf("d"), "동점이면 받은 순서를 지킨다");
});

test("지난 프레임에 서 있던 사람이 같은 칸을 다투면 이긴다 — 밀 때 안 깜빡인다", () => {
  const { keptFirst } = require("../src/components/map/render/cover-spread.ts");
  const cands = [{ id: "new1" }, { id: "old" }, { id: "new2" }];
  const order = keptFirst(cands, (c) => c.id === "old");

  assert.deepEqual(order, [1, 0, 2], "서 있던 사람이 맨 앞, 나머지는 원래 순서 그대로");

  const at = () => ({ x: 30, y: 30 });
  const picked = spreadOrder(order, at, RECT, 12);
  assert.equal(picked[0], 1, "칸 주인이 그대로 'old' 여야 자리가 안 바뀐다");
});

test("한쪽에 몰린 사람 20명을 뽑아도 반대쪽이 통째로 비지 않는다", () => {
  const pts = [];
  for (let i = 0; i < 40; i++) pts.push({ x: 40 + (i % 8) * 18, y: 40 + Math.floor(i / 8) * 18 });
  for (let i = 0; i < 4; i++) pts.push({ x: 1300 + i * 20, y: 760 });

  const order = keptFirstIdentity(pts.length);
  const picked = spreadOrder(order, (i) => pts[i], RECT, 20).slice(0, 20);
  const rightBottom = picked.filter((i) => i >= 40).length;

  assert.ok(rightBottom > 0, "오른쪽 아래 사람이 한 명도 안 뽑혔다 — 몰린 쪽이 다 차지했다");

  assert.equal(rightBottom, 2, "떨어진 무리가 든 칸 수만큼은 반드시 뽑힌다");
  const leftTop = picked.filter((i) => i < 40).length;
  assert.ok(leftTop < 40, "몰린 쪽이 상한을 다 먹으면 안 된다");
});

function keptFirstIdentity(n) {
  const { keptFirst } = require("../src/components/map/render/cover-spread.ts");
  return keptFirst(Array.from({ length: n }, (_, i) => i), () => false);
}

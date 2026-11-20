/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MapEngine } = require("../src/components/map/engine/map-engine.ts");

const pt = (id, x, y) => ({ musicId: id, pc: Array.from({ length: 16 }, (_, k) => (k === 0 ? x : k === 1 ? y : (id % 7) - 3)), genreId: 1, weight: 1, title: `t${id}`, artist: "a", youtubeUrl: null, playable: false });
const songs = [];
for (let gx = -2, id = 1; gx <= 2; gx++) for (let gy = -2; gy <= 2; gy++) songs.push(pt(id++, gx * 0.6, gy * 0.6));

function engine() {
  const e = new MapEngine();
  e.setSize(1280, 800);
  e.setLayerSongs(0, songs);
  e.frame(performance.now());
  return e;
}

function drilled(e, layer, residentPerLayer) {
  const box = (l) => ({ layer: l, xMin: -9, xMax: 9, yMin: -9, yMax: 9 });
  e.layer = layer;
  e.boxes = Array.from({ length: layer }, (_, l) => box(l));
  e.stack = Array.from({ length: layer }, (_, l) => ({
    layer: l,
    cam: { ...e.cam },
    subset: mask(residentPerLayer[l] ?? []),
    entryS: e.cam.s,
  }));

  e.subset = mask(residentPerLayer[layer] ?? []);
  e.rebuildAliveIdx();
}
const idx = (id) => songs.findIndex((s) => s.musicId === id);
const mask = (ids) => {
  const m = new Uint8Array(songs.length);
  for (const id of ids) m[idx(id)] = 1;
  return m;
};

test("이 겹에 있는 곡은 겹을 안 옮기고 확대해 간다", () => {
  const e = engine();
  assert.equal(e.isAlive(7), true, "레이어 0 에서는 다 상주한다");
  assert.equal(e.revealSong(7), "focused");
  assert.equal(e.selectedId, 7);
  assert.equal(e.anim, null, "겹을 옮기지 않았다");
});

test("위 겹에 있는 곡이면 그중 가장 가까운 겹으로 올라간다", () => {
  const e = engine();

  drilled(e, 3, { 0: [9, 1], 1: [1], 2: [9, 1], 3: [1] });
  assert.equal(e.isAlive(9), false, "지금 겹에는 없다");
  assert.equal(e.revealSong(9), "risen");
  assert.equal(e.anim.layer, 2, "한 번에 0 까지 가지 않는다");
  assert.equal(e.centerAfterMorph, 9, "도착하면 그 곡을 한복판에 둔다");
});

test("어느 겹에도 없는 곡이면 최상위까지 올라가 그 자리에 끼워 넣는다", () => {
  const e = engine();
  drilled(e, 2, { 0: [1], 1: [1], 2: [1] });
  assert.equal(e.revealSong(9), "surfaced");
  assert.equal(e.anim.layer, 0);

  assert.equal(e.anim.subset[idx(9)], 1);
});

test("최상위에서는 겹을 안 옮기고 그 자리에 바로 띄운다", () => {
  const e = engine();

  e.subset = mask([1, 2, 3]);
  e.rebuildAliveIdx();
  assert.equal(e.isAlive(9), false);
  assert.equal(e.revealSong(9), "focused");
  assert.equal(e.anim, null, "옮길 겹이 없다");
  assert.equal(e.isAlive(9), true, "그 자리에 띄운다");
});

test("보러 가도 내 위치는 그대로다 — 내 위치로 가기가 살아 있다", () => {
  const e = engine();
  e.travelTo(3);
  assert.equal(e.canGoHome(), true);
  drilled(e, 2, { 0: [1], 1: [1], 2: [1] });
  e.revealSong(9);

  assert.equal(e.home.musicId, 3, "돌아갈 자리가 검색한 곡으로 바뀌지 않았다");
  assert.equal(e.canGoHome(), true, "내 위치로 가기가 살아 있다");
});

test("지도가 모르는 곡은 손대지 않는다 — 좌표가 없으면 놓을 자리가 없다", () => {
  const e = engine();
  assert.equal(e.revealSong(99999), "none");
});

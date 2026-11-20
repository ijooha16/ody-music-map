/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MapEngine } = require("../src/components/map/engine/map-engine.ts");
const { FOLLOW } = require("../src/constants/map.ts");

const W = 1280;
const H = 800;

const pt = (id, x, y) => ({ musicId: id, pc: [x, y, ...Array(14).fill(0)], genreId: 1, weight: 1, title: `t${id}`, artist: "a", youtubeUrl: null });

const songs = [];
for (let gx = -3, id = 1; gx <= 3; gx++) for (let gy = -3; gy <= 3; gy++) songs.push(pt(id++, gx * 0.7, gy * 0.7));
const HOME = 25;
const FAR = 4;

const leader = (musicId) => ({ email: "L", nickname: "L", isOnline: true, isPublic: true, musicId, viewingMusicId: musicId, x: 0, y: 0, avatarSeed: [0.5], genreId: 1, riderCount: 0 });

function offCenter(e, x, y) {
  const s = e.worldToScreen(x, y);
  const fr = e.freeRect();
  return Math.hypot(s.px - fr.cx, s.py - fr.cy);
}
const starOff = (e, id) => { const w = e.worldOf(id); return offCenter(e, w.x, w.y); };
const meOff = (e) => offCenter(e, e.me.x, e.me.y);

function board() {
  const e = new MapEngine();
  e.setSize(W, H);
  e.setLayerSongs(0, songs);
  let t = performance.now();
  e.frame(t);
  e.startFollow(leader(HOME), true);
  for (let k = 0; k < 200; k++) e.frame((t += 16));
  return { e, t };
}

function flyTo(e, t, toId) {
  e.rideTo(toId);
  e.follow.mv.t0 = t;
  for (let k = 0; k <= FOLLOW.moveMs / 16; k++) e.frame((t += 16));
  return t;
}

test("비행이 끝나면 내 표식이 도착한 별 위에 선다", () => {
  const { e, t } = board();
  flyTo(e, t, FAR);
  const w = e.worldOf(FAR);
  const gap = Math.hypot(e.me.x - w.x, e.me.y - w.y) * e.cam.s;

  assert.ok(gap < 0.5, `도착지에서 ${gap.toFixed(1)}px 떨어져 있다`);
  assert.ok(meOff(e) < 1, `내 표식이 한복판에서 ${meOff(e).toFixed(1)}px 떨어져 있다`);
});

test("서버가 모는 길 — 상세 없이 바로 재생해도 도착 때는 한복판이다", () => {
  const { e, t } = board();

  flyTo(e, t, FAR);
  assert.ok(starOff(e, FAR) < 1, `목적지 별이 ${starOff(e, FAR).toFixed(0)}px 밖에 있다`);
});

test("상세를 먼저 열었으면 우주선이 오는 동안 뷰가 멈춰 있다", () => {
  const { e, t: t0 } = board();
  let t = t0;
  e.rideViewing(FAR);
  for (let k = 0; k < FOLLOW.viewToPlayMs / 16; k++) e.frame((t += 16));

  const before = { cx: e.cam.cx, cy: e.cam.cy };
  t = flyTo(e, t, FAR);
  const moved = Math.hypot(e.cam.cx - before.cx, e.cam.cy - before.cy) * e.cam.s;
  assert.ok(moved < 1, `비행 중 뷰가 ${moved.toFixed(1)}px 움직였다`);
});

test("탑승하면 인솔자 자리가 한복판으로 온다", () => {
  const { e } = board();
  assert.ok(starOff(e, HOME) < 1);
  assert.ok(meOff(e) < 1);
});

test("탑승 응답이 진짜 곡을 가져오면 임시 곡의 우주선이 그리로 날고 뷰도 따라간다", () => {
  const { e, t } = board();
  e.startFollow(leader(FAR), true);
  assert.ok(e.follow.mv && e.follow.mv.toId === FAR, "우주선이 진짜 곡으로 난다");
  e.follow.mv.t0 = t;
  let now = t;
  for (let k = 0; k <= FOLLOW.moveMs / 16 + 200; k++) e.frame((now += 16));
  assert.equal(e.follow.playingMusicId, FAR);
  assert.ok(starOff(e, FAR) < 1, `인솔자 곡이 한복판에서 ${starOff(e, FAR).toFixed(0)}px 떨어져 있다`);
  assert.ok(meOff(e) < 1, `내 표식이 한복판에서 ${meOff(e).toFixed(1)}px 떨어져 있다`);
});

test("이미 그 곡으로 날고 있으면(RIDE_TRACK) 다시 걸어도 비행을 지우지 않는다", () => {
  const { e, t } = board();
  e.rideTo(FAR);
  const mv = e.follow.mv;
  e.startFollow(leader(FAR), true);
  assert.equal(e.follow.mv, mv, "같은 비행이 그대로다");
  void t;
});

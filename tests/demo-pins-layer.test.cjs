/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MapEngine } = require("../src/components/map/engine/map-engine.ts");
const { DRILL } = require("../src/constants/map.ts");
const { insideBoxes } = require("../src/components/map/engine/my-place.ts");

const pt = (id, x, y) => ({ musicId: id, pc: Array.from({ length: 16 }, (_, k) => (k % 2 ? y : x)), genreId: 1, weight: 1, title: `t${id}`, artist: "a", youtubeUrl: null });
const songs = [];
for (let gx = -3, id = 1; gx <= 3; gx++) for (let gy = -3; gy <= 3; gy++) songs.push(pt(id++, gx * 0.7, gy * 0.7));
const HOME = 25;
const FAR = 1;
const leader = (musicId) => ({ email: "L", nickname: "L", isOnline: true, isPublic: true, musicId, viewingMusicId: musicId, x: 0, y: 0, avatarSeed: [0.5], genreId: 1, riderCount: 0 });

function settle(e, t) {
  for (let k = 0; k <= DRILL.morphMs / 16 + 20; k++) e.frame((t += 16));
  return t;
}
const alive = (e, id) => e.subset[e.indexOf(id)] === 1;

test("minLayer 가 있는 시연 곡은 최상단에서 감추고, 파고들면 보인다", () => {
  const e = new MapEngine();
  e.setSize(1280, 800);
  e.setLayerSongs(0, songs);
  let t = performance.now();
  e.frame(t);
  e.setDemoIds([HOME, FAR], new Map([[FAR, 0], [HOME, 1]]));
  assert.equal(alive(e, FAR), true, "minLayer 0 은 최상단에 있다");
  assert.equal(alive(e, HOME), false, "minLayer 1 은 최상단에서 감춘다");

  e.startFollow(leader(HOME), true);
  t = settle(e, t);
  assert.equal(e.rideToLayer(1, HOME), true);
  t = settle(e, t);
  assert.equal(e.layer, 1);

  assert.equal(insideBoxes(songs[HOME - 1].pc, e.boxes, 1), true);
  assert.equal(insideBoxes(songs[FAR - 1].pc, e.boxes, 1), false);

  const inBox = songs.filter((s) => s.musicId !== HOME && insideBoxes(s.pc, e.boxes, 1));
  e.setLayerSongs(1, inBox);
  settle(e, t);
  assert.equal(alive(e, HOME), true, "파고든 겹에서 사각형 안의 시연 곡은 top-k 에 빠졌어도 보인다");
  assert.equal(alive(e, FAR), false, "다른 갈래의 시연 곡은 뜨지 않는다");
});

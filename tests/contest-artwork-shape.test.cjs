/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { toShape } = require("../src/lib/contest-bff.ts");

test("좌표·닫힘을 그대로 옮기고, 이름이 없는 곡도 원소는 남긴다", () => {
  const s = toShape({
    artworkId: 7,
    closed: true,
    tracks: [
      { musicId: 1, title: "A", artist: "X", x: -0.5, y: 0.2 },
      { musicId: 2, title: null, artist: null, x: 0.4, y: -0.1 },
    ],
  });
  assert.equal(s.artworkId, 7);
  assert.equal(s.closed, true);
  assert.equal(s.tracks.length, 2);
  assert.deepEqual(s.tracks[1], { musicId: 2, title: null, artist: null, x: 0.4, y: -0.1 });
});

test("tracks 가 없으면 빈 그림 — 카드는 그림 자리만 비운다", () => {
  assert.deepEqual(toShape({ artworkId: 7, closed: false, tracks: null }).tracks, []);
});

/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { rideViewOf, sameRideView } = require("../src/lib/realtime/ride-view.ts");

test("주변 탐색은 중심곡, 여정은 시작·끝곡, 플리는 번호를 싣는다", () => {
  assert.deepEqual(rideViewOf({ viewMode: "nearby", nearbyCenterMusicId: 7, constellationSource: null }), { kind: "nearby", centerMusicId: 7 });
  assert.deepEqual(
    rideViewOf({ viewMode: "constellation", nearbyCenterMusicId: null, constellationSource: { kind: "journey", startMusicId: 1, endMusicId: 2 } }),
    { kind: "journey", startMusicId: 1, endMusicId: 2 },
  );
  assert.deepEqual(rideViewOf({ viewMode: "constellation", nearbyCenterMusicId: null, constellationSource: { kind: "playlist", playlistId: 9 } }), { kind: "playlist", playlistId: 9 });
});

test("재현할 수 없는 상태는 기본으로 말한다 — 뷰가 꺼진 목록, 출처 없는 별자리, 중심곡 없는 주변 탐색", () => {
  assert.deepEqual(rideViewOf({ viewMode: "default", nearbyCenterMusicId: null, constellationSource: { kind: "playlist", playlistId: 9 } }), { kind: "default" });
  assert.deepEqual(rideViewOf({ viewMode: "constellation", nearbyCenterMusicId: null, constellationSource: null }), { kind: "default" });
  assert.deepEqual(rideViewOf({ viewMode: "constellation", nearbyCenterMusicId: null, constellationSource: { kind: "single" } }), { kind: "default" });
  assert.deepEqual(rideViewOf({ viewMode: "nearby", nearbyCenterMusicId: null, constellationSource: null }), { kind: "default" });
});

test("같은 화면이면 다시 보내지 않는다 — 번호까지 같아야 같다", () => {
  assert.equal(sameRideView({ kind: "default" }, { kind: "default" }), true);
  assert.equal(sameRideView({ kind: "playlist", playlistId: 1 }, { kind: "playlist", playlistId: 1 }), true);
  assert.equal(sameRideView({ kind: "playlist", playlistId: 1 }, { kind: "playlist", playlistId: 2 }), false);
  assert.equal(sameRideView({ kind: "journey", startMusicId: 1, endMusicId: 2 }, { kind: "journey", startMusicId: 2, endMusicId: 1 }), false);
  assert.equal(sameRideView({ kind: "nearby", centerMusicId: 3 }, { kind: "default" }), false);
});

/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { playSourceOf, shouldDeclare } = require("../src/lib/play-declare.ts");

const base = { musicId: 10, declareSeq: 1, lastSeq: null, riding: false };

test("목록 종류가 source 가 된다", () => {
  assert.equal(playSourceOf("journey"), "JOURNEY");
  assert.equal(playSourceOf("playlist"), "PLAYLIST");
  assert.equal(playSourceOf("single"), "MAP");

  assert.equal(playSourceOf("nearby"), "MAP");
});

test("새 번호면 선언한다", () => {
  assert.equal(shouldDeclare(base), true, "첫 재생");
  assert.equal(shouldDeclare({ ...base, declareSeq: 5, lastSeq: 4 }), true, "큐가 넘어갔다");
});

test("같은 번호를 두 번 보내지 않는다", () => {
  assert.equal(shouldDeclare({ ...base, declareSeq: 3, lastSeq: 3 }), false);
});

test("같은 곡을 다시 틀어도 번호가 다르면 선언한다", () => {
  assert.equal(shouldDeclare({ musicId: 10, declareSeq: 7, lastSeq: 6, riding: false }), true);
});

test("따라가는 중에는 한 건도 안 보낸다", () => {
  assert.equal(shouldDeclare({ ...base, riding: true }), false);
  assert.equal(shouldDeclare({ ...base, declareSeq: 9, lastSeq: 1, riding: true }), false);
});

test("틀 곡이 없으면 안 보낸다", () => {
  assert.equal(shouldDeclare({ ...base, musicId: null }), false, "정지 직후");
});

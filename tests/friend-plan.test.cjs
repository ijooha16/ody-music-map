/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { reusablePlan } = require("../src/components/map/engine/friend-plan.ts");

const plan = [
  { marker: "a", stacked: ["b", "c"] },
  { marker: "d", stacked: [] },
];
const setOf = (...xs) => new Set(xs);

test("명단이 그대로면 지난 배치를 다시 쓴다", () => {
  const got = reusablePlan(plan, setOf("a", "b", "c", "d"));
  assert.deepEqual(got, plan);
  assert.notEqual(got, plan, "사본을 준다 — 부르는 쪽이 고쳐도 원본이 안 상한다");
});

test("아직 배치가 없으면 새로 정한다", () => {
  assert.equal(reusablePlan(null, setOf("a")), null);
});

test("한 명이라도 나가면 다시 정한다", () => {
  assert.equal(reusablePlan(plan, setOf("a", "b", "d")), null, "묶여 있던 c 가 나갔다");
  assert.equal(reusablePlan(plan, setOf("b", "c", "d")), null, "대표였던 a 가 나갔다");
});

test("한 명이라도 들어오면 다시 정한다", () => {
  assert.equal(reusablePlan(plan, setOf("a", "b", "c", "d", "e")), null);
});

test("인솔자가 남의 묶음 속이면 다시 정한다", () => {
  assert.equal(reusablePlan(plan, setOf("a", "b", "c", "d"), "b"), null);
});

test("인솔자가 이미 제 표식이면 그대로 쓴다 — 따라가는 중 깜빡이지 않는다", () => {
  assert.deepEqual(reusablePlan(plan, setOf("a", "b", "c", "d"), "d"), plan);
});

test("아무도 없으면 빈 배치를 그대로 쓴다", () => {
  assert.deepEqual(reusablePlan([], setOf()), []);
  assert.equal(reusablePlan([], setOf("a")), null, "없던 사람이 생겼다");
});

test("우주선이 남의 묶음 속이면 다시 정한다", () => {
  assert.equal(reusablePlan(plan, setOf("a", "b", "c", "d"), null, setOf("c")), null);
  assert.deepEqual(reusablePlan(plan, setOf("a", "b", "c", "d"), null, setOf("a")), plan, "우주선이 이미 대표면 그대로 쓴다");
  assert.deepEqual(reusablePlan(plan, setOf("a", "b", "c", "d"), null, setOf("d")), plan);
});

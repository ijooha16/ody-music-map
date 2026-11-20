/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { REPORT_REASONS, reportReasonsFor, REPORT_NEEDS_DETAIL, REPORT_DETAIL_MAX } = require("../src/constants/report.ts");

const values = (list) => list.map((r) => r.value);

test("백엔드에 보내는 값 목록", () => {
  assert.deepEqual(values(REPORT_REASONS), ["spoken", "noise", "mistitled", "other", "unplayable"]);
});

test("기타는 늘 마지막 일반 사유다 — 나머지를 받는 자리라 사이에 끼면 먼저 눌린다", () => {
  const general = values(reportReasonsFor(false));
  assert.equal(general[general.length - 1], "other");
});

test("재생되는 곡에는 재생 불가를 안 보여준다 — 잘못 누르면 걸러낼 방법이 없다", () => {
  assert.deepEqual(values(reportReasonsFor(false)), ["spoken", "noise", "mistitled", "other"]);
});

test("재생 불가인 곡에서만 그 사유가 붙는다", () => {
  assert.deepEqual(values(reportReasonsFor(true)), ["spoken", "noise", "mistitled", "other", "unplayable"]);
});

test("상세를 받아야 하는 사유는 기타 하나뿐이다", () => {
  assert.equal(REPORT_NEEDS_DETAIL, "other");
  assert.equal(REPORT_REASONS.filter((r) => r.value === REPORT_NEEDS_DETAIL).length, 1);
});

test("상세 길이 상한이 백엔드 제약과 같다", () => {
  assert.equal(REPORT_DETAIL_MAX, 2000);
});

test("모든 사유에 화면에 띄울 말이 있다", () => {
  for (const r of REPORT_REASONS) {
    assert.ok(r.label, `${r.value} 에 label 이 없다`);
    assert.ok(r.detail, `${r.value} 에 detail 이 없다`);
  }
});

/* eslint-disable @typescript-eslint/no-require-imports */

const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { usePanelStore } = require("../src/stores/use-panel-store.ts");

const panel = () => usePanelStore.getState();

beforeEach(() => usePanelStore.setState(usePanelStore.getInitialState(), true));

test("주변 사람을 펼쳐 둬도 지도에서 별을 누르면 곡 상세로 간다", () => {
  panel().openFriends();
  panel().openSongFromMap(42);

  assert.equal(panel().activePanel, "song", "다른 패널과 같게 돈다");
  assert.equal(panel().musicId, 42);
  assert.deepEqual(panel().history, [], "지도에서 바로 연 상세에는 돌아갈 자리가 없다 — 여기도 예외가 아니다");
});

test("접어 둔 주변 사람에서도 마찬가지다 — 단에 따라 갈리지 않는다", () => {
  panel().openFriends();
  panel().toggleCollapsed();
  assert.equal(panel().snap, 1, "데스크톱 손잡이는 1(접힘) 과 3(펼침) 을 오간다");

  panel().openSongFromMap(42);
  assert.equal(panel().activePanel, "song");
  assert.equal(panel().musicId, 42);
  assert.deepEqual(panel().history, []);
});

test("주변 사람을 닫았을 때도 같다", () => {
  panel().openFriends();
  panel().close();
  panel().openSongFromMap(42);

  assert.equal(panel().activePanel, "song");
  assert.equal(panel().musicId, 42);
  assert.deepEqual(panel().history, []);
});

test("다른 패널에서도 지도 클릭은 상세로 간다", () => {
  panel().openChart();
  panel().openSongFromMap(7);
  assert.equal(panel().activePanel, "song");
  assert.equal(panel().musicId, 7);
});

test("지도를 끌면 주변 사람도 다른 패널처럼 내려온다", () => {
  panel().openFriends();
  panel().collapse();
  assert.equal(panel().snap, 1, "예외 없이 지도에 자리를 비켜 준다");

  panel().openChart();
  panel().collapse();
  assert.equal(panel().snap, 1, "나머지도 그대로다");
});

test("목록에서 들어간 상세는 돌아갈 자리를 그대로 기억한다 — 이건 안 건드렸다", () => {
  panel().openJourney();
  panel().openSongFromList(3);
  assert.deepEqual(panel().history, [{ panel: "journey" }]);

  panel().goBack();
  assert.equal(panel().activePanel, "journey");
  assert.deepEqual(panel().history, []);
});

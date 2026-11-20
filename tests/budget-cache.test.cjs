/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { BudgetCache, canvasBytes } = require("../src/lib/budget-cache.ts");

const canvas = (side) => ({ width: side, height: side });

test("예산을 넘으면 가장 오래 안 쓴 것부터 나간다", () => {
  const cache = new BudgetCache(300, (v) => v.cost);
  cache.set("a", { cost: 100 });
  cache.set("b", { cost: 100 });
  cache.set("c", { cost: 100 });
  cache.set("d", { cost: 100 });

  assert.equal(cache.get("a"), undefined, "가장 먼저 넣은 것이 나간다");
  assert.ok(cache.get("d"), "방금 넣은 것은 남는다");
  assert.ok(cache.bytes <= 300);
});

test("꺼내 쓰면 다시 최근 것이 되어 살아남는다", () => {
  const cache = new BudgetCache(300, (v) => v.cost);
  cache.set("a", { cost: 100 });
  cache.set("b", { cost: 100 });
  cache.set("c", { cost: 100 });
  cache.get("a");
  cache.set("d", { cost: 100 });

  assert.ok(cache.get("a"), "다시 쓴 것은 남는다");
  assert.equal(cache.get("b"), undefined, "그 다음으로 오래된 것이 나간다");
});

test("has 는 순서를 건드리지 않는다", () => {
  const cache = new BudgetCache(200, (v) => v.cost);
  cache.set("a", { cost: 100 });
  cache.set("b", { cost: 100 });
  cache.has("a");
  cache.set("c", { cost: 100 });

  assert.equal(cache.get("a"), undefined, "훑기만 한 것은 여전히 가장 오래된 것이다");
});

test("예산보다 큰 것을 넣어도 그 한 장은 남는다", () => {
  const cache = new BudgetCache(100, (v) => v.cost);
  cache.set("a", { cost: 50 });
  cache.set("big", { cost: 999 });

  assert.ok(cache.get("big"));
  assert.equal(cache.size, 1);
});

test("같은 키를 덮어쓰면 크기를 두 번 세지 않는다", () => {
  const cache = new BudgetCache(1000, (v) => v.cost);
  cache.set("a", { cost: 100 });
  cache.set("a", { cost: 40 });

  assert.equal(cache.size, 1);
  assert.equal(cache.bytes, 40);
});

test("캔버스 크기는 픽셀당 4바이트다", () => {
  assert.equal(canvasBytes(canvas(104)), 104 * 104 * 4);

  assert.equal(Math.round(canvasBytes(canvas(512)) / canvasBytes(canvas(104))), 24);
});

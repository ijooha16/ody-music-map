/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { drawShip } = require("../src/components/map/render/draw-friends.ts");

function recorder() {
  const calls = [];
  const g = {
    _fill: "",
    set fillStyle(v) {
      this._fill = v;
    },
    get fillStyle() {
      return this._fill;
    },
    set strokeStyle(v) {},
    set lineWidth(v) {},
    set font(v) {},
    set textAlign(v) {},
    set textBaseline(v) {},
    set globalAlpha(v) {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    bezierCurveTo(...a) {
      calls.push({ op: "bezier", y: Math.max(a[1], a[3], a[5]) });
    },
    arc() {},
    clip() {},
    fillRect() {},
    drawImage() {},
    fillText() {},
    fill() {
      calls.push({ op: "fill", style: this._fill });
    },
    stroke() {},
  };
  return { g, calls };
}

const fills = (calls) => calls.filter((c) => c.op === "fill").map((c) => c.style);

test("불꽃이 몸통보다 먼저 그려진다 — 뒤로 깔려야 꼬리에서 뿜는 것으로 보인다", () => {
  const { g, calls } = recorder();
  drawShip(g, 100, 100, 20, 0, 0);
  const order = fills(calls);
  const body = order.indexOf("#e9f1ff");

  const flames = order.slice(0, body).filter((s) => /^rgba\(79,227,206,0\./.test(s));
  assert.ok(body > 0, "몸통이 그려진다");
  assert.equal(flames.length, 2, `겉불꽃과 심지 두 겹이 몸통보다 먼저 (실제: ${order.slice(0, body).join(" | ")})`);
});

test("지느러미도 몸통보다 먼저다 — 기존 순서를 깨지 않았다", () => {
  const { g, calls } = recorder();
  drawShip(g, 100, 100, 20, 0, 0);
  const order = fills(calls);

  assert.ok(
    order.indexOf("rgba(79,227,206,1)") < order.indexOf("#e9f1ff"),
    "지느러미가 몸통보다 먼저",
  );
});

test("불꽃은 배 크기를 따라간다", () => {
  const small = recorder();
  const big = recorder();
  drawShip(small.g, 100, 100, 10, 0, 0);
  drawShip(big.g, 100, 100, 20, 0, 0);
  const reach = (calls) => Math.max(...calls.filter((c) => c.op === "bezier").map((c) => c.y));
  assert.ok(reach(big.calls) > reach(small.calls) * 1.8, "R 이 두 배면 꼬리 끝도 대략 두 배");
});

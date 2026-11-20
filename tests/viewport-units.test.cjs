/* eslint-disable @typescript-eslint/no-require-imports */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SRC = path.resolve(__dirname, "../src");
const EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

const BANNED = /(?<![a-z])100v[hw]\b/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return EXTENSIONS.has(path.extname(entry.name)) ? [full] : [];
  });
}

test("src 에 100vh·100vw 가 없다 — 모바일에서 주소창만큼 어긋난다", () => {
  const hits = [];
  for (const file of walk(SRC)) {
    fs.readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (BANNED.test(line)) hits.push(`${path.relative(SRC, file)}:${i + 1}  ${line.trim().slice(0, 90)}`);
      });
  }
  assert.deepEqual(hits, [], `100vh/100vw 를 dvh/dvw 로 바꾼다:\n${hits.join("\n")}`);
});

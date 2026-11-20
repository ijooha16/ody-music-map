import type { LayerBox } from "@/types";

export function insideBoxes(pc: readonly number[], boxes: readonly LayerBox[], upTo: number): boolean {
  return firstMismatch(pc, boxes, upTo) == null;
}

export function firstMismatch(pc: readonly number[], boxes: readonly LayerBox[], upTo: number): number | null {
  for (let l = 0; l < upTo; l++) {
    const b = boxes[l];
    if (!b) return l;
    const x = pc[b.layer * 2];
    const y = pc[b.layer * 2 + 1];
    if (x == null || y == null || x < b.xMin || x > b.xMax || y < b.yMin || y > b.yMax) return l;
  }
  return null;
}

const EPS = 1e-9;
const sameBox = (a: LayerBox, b: LayerBox) =>
  a.layer === b.layer && Math.abs(a.xMin - b.xMin) < EPS && Math.abs(a.xMax - b.xMax) < EPS && Math.abs(a.yMin - b.yMin) < EPS && Math.abs(a.yMax - b.yMax) < EPS;

export function sharedDepth(a: readonly LayerBox[], b: readonly LayerBox[]): number {
  const n = Math.min(a.length, b.length);
  let k = 0;
  while (k < n && sameBox(a[k], b[k])) k++;
  return k;
}

export function homeRoute(current: readonly LayerBox[], home: readonly LayerBox[]): { riseTo: number; dives: LayerBox[] } {
  const riseTo = sharedDepth(current, home);
  return { riseTo, dives: home.slice(riseTo) };
}

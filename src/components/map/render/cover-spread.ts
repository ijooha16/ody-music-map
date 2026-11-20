export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function gridFor(n: number, rect: Rect): { cols: number; rows: number } {
  const w = Math.max(1, rect.x1 - rect.x0);
  const h = Math.max(1, rect.y1 - rect.y0);
  const cols = Math.max(1, Math.round(Math.sqrt((n * w) / h)));
  return { cols, rows: Math.max(1, Math.ceil(n / cols)) };
}

export function cellOf(x: number, y: number, rect: Rect, cols: number, rows: number): number {
  const w = Math.max(1, rect.x1 - rect.x0);
  const h = Math.max(1, rect.y1 - rect.y0);
  const cx = clamp(Math.floor(((x - rect.x0) / w) * cols), 0, cols - 1);
  const cy = clamp(Math.floor(((y - rect.y0) / h) * rows), 0, rows - 1);
  return cy * cols + cx;
}

export function spreadOrder(
  candidates: readonly number[],
  at: (i: number) => { x: number; y: number },
  rect: Rect,
  n: number,
  taken: ReadonlySet<number> = new Set(),
): number[] {
  const { cols, rows } = gridFor(n, rect);
  const first = new Map<number, number>();
  const rest: number[] = [];
  for (const i of candidates) {
    const { x, y } = at(i);
    const key = cellOf(x, y, rect, cols, rows);
    if (taken.has(key)) continue;
    if (first.has(key)) rest.push(i);
    else first.set(key, i);
  }
  return [...first.values(), ...rest];
}

export function byCoverPriority<T>(hasAlbum: (v: T) => boolean, weightOf: (v: T) => number) {
  return (a: T, b: T) => {
    const d = Number(hasAlbum(b)) - Number(hasAlbum(a));
    return d !== 0 ? d : weightOf(b) - weightOf(a);
  };
}

export function keptFirst<T>(items: readonly T[], kept: (v: T) => boolean): number[] {
  const stay: number[] = [];
  const rest: number[] = [];
  items.forEach((v, i) => (kept(v) ? stay : rest).push(i));
  return [...stay, ...rest];
}

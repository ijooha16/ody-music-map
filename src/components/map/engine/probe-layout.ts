export interface LabelBox {
  id: number;

  x: number;
  y: number;

  w: number;

  top: number;
  bottom: number;

  fixed?: boolean;
}

export interface LabelBounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function keepInside(b: LabelBox, r: LabelBounds) {
  const minX = r.x0 + b.w / 2;
  const maxX = r.x1 - b.w / 2;
  b.x = minX > maxX ? (r.x0 + r.x1) / 2 : Math.min(maxX, Math.max(minX, b.x));
  const minY = r.y0 - b.top;
  const maxY = r.y1 - b.bottom;
  b.y = minY > maxY ? (minY + maxY) / 2 : Math.min(maxY, Math.max(minY, b.y));
}

export function separateLabels(boxes: readonly LabelBox[], gap: number, maxIter = 160, bounds?: LabelBounds): Map<number, { x: number; y: number }> {
  const p = boxes.map((b) => ({ ...b }));
  const confine = () => {
    if (bounds) for (const b of p) if (!b.fixed) keepInside(b, bounds);
  };
  confine();
  for (let it = 0; it < maxIter; it++) {
    let moved = false;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const a = p[i];
        const b = p[j];
        if (a.fixed && b.fixed) continue;
        const ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2) + gap;
        const oy = Math.min(a.y + a.bottom, b.y + b.bottom) - Math.max(a.y + a.top, b.y + b.top) + gap;
        if (ox <= 0 || oy <= 0) continue;
        moved = true;

        const byX = ox < oy;
        const d = byX ? b.x - a.x : b.y + (b.top + b.bottom) / 2 - (a.y + (a.top + a.bottom) / 2);
        const sign = d > 0 || (d === 0 && j > i) ? 1 : -1;
        const push = byX ? ox : oy;
        const ka = a.fixed ? 0 : b.fixed ? 1 : 0.5;
        const kb = 1 - ka;
        if (byX) {
          a.x -= sign * push * ka;
          b.x += sign * push * kb;
        } else {
          a.y -= sign * push * ka;
          b.y += sign * push * kb;
        }
      }
    }

    confine();
    if (!moved) break;
  }
  return new Map(p.map((b) => [b.id, { x: b.x, y: b.y }]));
}

function tooClose(a: LabelBox, ax: number, ay: number, b: LabelBox, bx: number, by: number, gap: number) {
  return (
    Math.min(ax + a.w / 2, bx + b.w / 2) - Math.max(ax - a.w / 2, bx - b.w / 2) + gap > 1e-6 &&
    Math.min(ay + a.bottom, by + b.bottom) - Math.max(ay + a.top, by + b.top) + gap > 1e-6
  );
}

export function placeLabels(
  boxes: readonly LabelBox[],
  gap: number,
  bounds: LabelBounds,
  maxShift: number,
  star?: { w: number; top: number; bottom: number },
  step = 4,
): Map<number, { x: number; y: number }> {
  const out = new Map<number, { x: number; y: number }>();
  const placed: { b: LabelBox; x: number; y: number }[] = [];
  for (const b of boxes) {
    if (!b.fixed) continue;
    placed.push({ b, x: b.x, y: b.y });
    out.set(b.id, { x: b.x, y: b.y });
  }

  const nearestFree = (b: LabelBox, at: { x: number; y: number }) => {
    const wideX = bounds.x0 + b.w / 2 > bounds.x1 - b.w / 2;
    const wideY = bounds.y0 - b.top > bounds.y1 - b.bottom;
    let best: { x: number; y: number } | null = null;
    let bestD = Infinity;
    for (let dx = wideX ? 0 : -maxShift; dx <= (wideX ? 0 : maxShift) + 1e-6; dx += step) {
      for (let dy = wideY ? 0 : -maxShift; dy <= (wideY ? 0 : maxShift) + 1e-6; dy += step) {
        const d = Math.hypot(dx, dy);
        if (d > maxShift + 1e-6 || d >= bestD) continue;
        const x = at.x + dx;
        const y = at.y + dy;
        if (!wideX && (x < bounds.x0 + b.w / 2 - 1e-6 || x > bounds.x1 - b.w / 2 + 1e-6)) continue;
        if (!wideY && (y < bounds.y0 - b.top - 1e-6 || y > bounds.y1 - b.bottom + 1e-6)) continue;
        if (placed.some((q) => tooClose(b, x, y, q.b, q.x, q.y, gap))) continue;
        best = { x, y };
        bestD = d;
      }
    }
    return best;
  };
  for (const b of boxes) {
    if (b.fixed) continue;
    const at = { ...b };
    keepInside(at, bounds);
    const spot = nearestFree(b, at);
    if (spot) {
      placed.push({ b, ...spot });
      out.set(b.id, spot);
      continue;
    }

    const s = star ? { ...b, ...star } : null;
    const sAt = s ? { ...s } : null;
    if (s && sAt) keepInside(sAt, bounds);
    const starSpot = s && sAt ? nearestFree(s, sAt) : null;
    if (s && starSpot) placed.push({ b: s, ...starSpot });
    out.set(b.id, starSpot ?? { x: at.x, y: at.y });
  }
  return out;
}

export interface LabelRect {
  id: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;

  keep?: boolean;
}

export function cullLabels(rects: readonly LabelRect[], gap: number): Set<number> {
  const hidden = new Set<number>();
  const shown: LabelRect[] = [];
  const hit = (a: LabelRect, b: LabelRect) =>
    Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) + gap > 1e-6 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) + gap > 1e-6;
  for (const r of rects) if (r.keep) shown.push(r);
  for (const r of rects) {
    if (r.keep) continue;
    if (shown.some((s) => hit(s, r))) hidden.add(r.id);
    else shown.push(r);
  }
  return hidden;
}

export function approxTextWidth(text: string, px: number, mono = false): number {
  let w = 0;
  for (const ch of text) w += (ch.codePointAt(0) ?? 0) >= 0x1100 ? px * 1.0 : px * (mono ? 0.64 : 0.6);
  return w;
}

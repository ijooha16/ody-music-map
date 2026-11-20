export interface Arc {
  ax: number;
  ay: number;
  bx: number;
  by: number;

  cx: number;
  cy: number;
  t0: number;
  dur: number;
}

export interface ArcPoint {
  x: number;
  y: number;

  heading: number;

  t: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function arcBetween(
  from: { x: number; y: number },
  to: { x: number; y: number },
  now: number,
  dur: number,
  bow: number,
  side: 1 | -1 = Math.random() < 0.5 ? 1 : -1,
): Arc {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const L = Math.hypot(dx, dy) || 1e-6;
  return {
    ax: from.x,
    ay: from.y,
    bx: to.x,
    by: to.y,
    cx: (from.x + to.x) / 2 - (dy / L) * L * bow * side,
    cy: (from.y + to.y) / 2 + (dx / L) * L * bow * side,
    t0: now,
    dur: Math.max(1, dur),
  };
}

export function atArc(a: Arc, now: number): ArcPoint {
  const t = Math.min(1, Math.max(0, (now - a.t0) / a.dur));
  const e = easeInOut(t);
  const q = 1 - e;
  const hx = 2 * q * (a.cx - a.ax) + 2 * e * (a.bx - a.cx);
  const hy = 2 * q * (a.cy - a.ay) + 2 * e * (a.by - a.cy);
  return {
    x: q * q * a.ax + 2 * q * e * a.cx + e * e * a.bx,
    y: q * q * a.ay + 2 * q * e * a.cy + e * e * a.by,
    heading: Math.atan2(hy, hx),
    t,
  };
}

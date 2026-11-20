export const SHIP_TURN_TAU_MS = 70;

const STALE_MS = 500;

const TAU = Math.PI * 2;

export function shortestTurn(a: number, b: number) {
  const d = (((b - a) % TAU) + TAU) % TAU;
  return d > Math.PI ? d - TAU : d;
}

export class ShipTurn {
  private readonly m = new Map<string, { ang: number; t: number }>();

  step(key: string, target: number | null, now: number, fallback = 0): number {
    const was = this.m.get(key);
    if (!was || now - was.t > STALE_MS) {
      const ang = target ?? was?.ang ?? fallback;
      this.m.set(key, { ang, t: now });
      return ang;
    }
    if (target == null) {
      was.t = now;
      return was.ang;
    }
    const k = 1 - Math.exp(-Math.max(0, now - was.t) / SHIP_TURN_TAU_MS);
    const ang = was.ang + shortestTurn(was.ang, target) * k;
    this.m.set(key, { ang, t: now });
    return ang;
  }
}

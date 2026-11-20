export interface Point {
  x: number;
  y: number;
}

export const distanceBetween = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

export function distanceFrom(me: Point | null, at: Point | null): number {
  if (!me || !at) return Number.POSITIVE_INFINITY;
  return distanceBetween(me, at);
}

export function radiusFromNeighbors(distances: readonly number[], k: number): number {
  const sorted = [...distances].filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  return sorted[Math.min(k, sorted.length) - 1];
}

export function withinRadius<T extends { distance: number }>(people: readonly T[], radius: number | null): T[] {
  if (radius == null || !(radius > 0)) return [];
  return people.filter((p) => p.distance <= radius);
}

export function nearestFirst<T extends { distance: number }>(people: readonly T[], max: number): T[] {
  if (max <= 0) return [];
  return [...people].sort((a, b) => a.distance - b.distance).slice(0, max);
}

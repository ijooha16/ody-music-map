export const MAX_CACHED_LAYER_SETS = 16;

export interface CachedLayerSet {
  key: string;

  active: boolean;

  usedAt: number;
}

export function layerSetsToEvict(entries: readonly CachedLayerSet[], cap: number = MAX_CACHED_LAYER_SETS): string[] {
  const over = entries.length - cap;
  if (over <= 0) return [];
  const evictable = entries.filter((e) => !e.active).sort((a, b) => a.usedAt - b.usedAt);
  return evictable.slice(0, Math.min(over, evictable.length)).map((e) => e.key);
}

const usedAt = new Map<string, number>();
let tick = 0;

export function touchLayerSet(key: string): void {
  usedAt.set(key, ++tick);
}

export function layerSetUsedAt(key: string): number {
  return usedAt.get(key) ?? 0;
}

export function forgetLayerSetsExcept(present: ReadonlySet<string>): void {
  for (const key of usedAt.keys()) if (!present.has(key)) usedAt.delete(key);
}

export function resetLayerSetOrder(): void {
  usedAt.clear();
  tick = 0;
}

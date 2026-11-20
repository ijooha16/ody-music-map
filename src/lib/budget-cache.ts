export class BudgetCache<K, V> {
  private readonly items = new Map<K, V>();
  private used = 0;

  constructor(
    private readonly budget: number,
    private readonly costOf: (value: V) => number,
  ) {}

  get(key: K): V | undefined {
    const hit = this.items.get(key);
    if (hit === undefined) return undefined;
    this.items.delete(key);
    this.items.set(key, hit);
    return hit;
  }

  has(key: K): boolean {
    return this.items.has(key);
  }

  set(key: K, value: V): V {
    const prev = this.items.get(key);
    if (prev !== undefined) this.used -= this.costOf(prev);
    this.items.delete(key);
    this.items.set(key, value);
    this.used += this.costOf(value);

    while (this.used > this.budget && this.items.size > 1) {
      const oldest = this.items.keys().next().value as K;
      this.used -= this.costOf(this.items.get(oldest)!);
      this.items.delete(oldest);
    }
    return value;
  }

  delete(key: K): void {
    const prev = this.items.get(key);
    if (prev === undefined) return;
    this.used -= this.costOf(prev);
    this.items.delete(key);
  }

  clear(): void {
    this.items.clear();
    this.used = 0;
  }

  get size(): number {
    return this.items.size;
  }

  get bytes(): number {
    return this.used;
  }
}

export const canvasBytes = (c: { width: number; height: number }): number => c.width * c.height * 4;

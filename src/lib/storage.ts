export type StorageScope = "local" | "session";

const pick = (scope: StorageScope) => (scope === "session" ? window.sessionStorage : window.localStorage);
const SCOPES: StorageScope[] = ["local", "session"];

const listeners = new Set<() => void>();

export function subscribeStorage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function resyncStorage(): void {
  notify();
}

export function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  for (const scope of SCOPES) {
    try {
      const raw = pick(scope).getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function readStorageScope(key: string): StorageScope | null {
  if (typeof window === "undefined") return null;
  for (const scope of SCOPES) {
    try {
      if (pick(scope).getItem(key)) return scope;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function writeStorage<T>(key: string, value: T, scope: StorageScope = "local"): void {
  if (typeof window === "undefined") return;
  try {
    pick(scope).setItem(key, JSON.stringify(value));

    pick(scope === "local" ? "session" : "local").removeItem(key);
  } catch {
    /* ignore */
  }
  notify();
}

export function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  for (const scope of SCOPES) {
    try {
      pick(scope).removeItem(key);
    } catch {
      /* ignore */
    }
  }
  notify();
}

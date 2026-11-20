import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, STORAGE_KEYS } from "@/constants";
import type { User } from "@/types";
import { readStorage, removeStorage, writeStorage } from "./storage";

const PERSISTED: readonly (readonly string[])[] = [
  ["auth", "me"],
  ["user", "profile"],
  ["playlist", "mine"],
  ["playlist", "liked"],
];

function isPersistedProfile(key: readonly unknown[], myEmail: string | null): boolean {
  return myEmail != null && key[2] === myEmail;
}

const MAX_AGE = 24 * 60 * 60 * 1000;

const THROTTLE = 1000;

interface Persisted {
  savedAt: number;
  state: ReturnType<typeof dehydrate>;
}

function isPersistedFamily(key: readonly unknown[]): boolean {
  return PERSISTED.some((p) => p.every((part, i) => key[i] === part));
}

function isPersisted(key: readonly unknown[], myEmail: string | null): boolean {
  if (!isPersistedFamily(key)) return false;
  if (key[0] === "user" && key[1] === "profile") return isPersistedProfile(key, myEmail);
  return true;
}

export function clearPersistedQueries(): void {
  removeStorage(STORAGE_KEYS.queryCache);
}

export function startQueryPersist(queryClient: QueryClient): () => void {
  const myEmail = () => queryClient.getQueryData<User>(QUERY_KEYS.auth.me)?.email ?? null;

  if (!readStorage<string>(STORAGE_KEYS.accessToken)) {
    clearPersistedQueries();
    return () => {};
  }

  const saved = readStorage<Persisted>(STORAGE_KEYS.queryCache);
  if (saved && Date.now() - saved.savedAt < MAX_AGE) hydrate(queryClient, saved.state);
  else if (saved) clearPersistedQueries();

  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    timer = null;
    writeStorage<Persisted>(STORAGE_KEYS.queryCache, {
      savedAt: Date.now(),

      state: dehydrate(queryClient, {
        shouldDehydrateQuery: (q) => q.state.status === "success" && isPersisted(q.queryKey, myEmail()),
      }),
    });
  };

  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (timer || !isPersistedFamily(event.query.queryKey)) return;
    timer = setTimeout(save, THROTTLE);
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}

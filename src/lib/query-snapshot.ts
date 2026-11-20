import type { QueryClient, QueryKey } from "@tanstack/react-query";

export async function snapshotQueries(qc: QueryClient, keys: readonly QueryKey[]): Promise<() => void> {
  await Promise.all(keys.map((queryKey) => qc.cancelQueries({ queryKey })));
  const saved = keys.flatMap((queryKey) => qc.getQueriesData<unknown>({ queryKey }));
  return () => {
    for (const [key, data] of saved) qc.setQueryData(key, data);
  };
}

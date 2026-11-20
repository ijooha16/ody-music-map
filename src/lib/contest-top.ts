import { CONTEST_TOP } from "@/constants";
import type { ContestEntry } from "@/types";

export function topEntries(items: readonly ContestEntry[], n: number = CONTEST_TOP): ContestEntry[] {
  return items
    .filter((e): e is ContestEntry & { rank: number } => e.rank != null)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, n);
}

export function contestRankOf(items: readonly ContestEntry[] | undefined, playlistId: number | null): number | null {
  if (!items || playlistId == null) return null;
  return topEntries(items).find((e) => e.playlistId === playlistId)?.rank ?? null;
}

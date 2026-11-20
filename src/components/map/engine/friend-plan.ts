const EMPTY: ReadonlySet<string> = new Set();

export interface FriendPlanEntry {
  marker: string;
  stacked: string[];
}

export function reusablePlan(
  plan: readonly FriendPlanEntry[] | null,
  present: ReadonlySet<string>,
  leader: string | null = null,
  ships: ReadonlySet<string> = EMPTY,
): FriendPlanEntry[] | null {
  if (!plan) return null;
  if (leader && !plan.some((entry) => entry.marker === leader)) return null;
  if (ships.size && plan.some((entry) => entry.stacked.some((email) => ships.has(email)))) return null;
  let count = 0;
  for (const entry of plan) {
    if (!present.has(entry.marker)) return null;
    count += 1;
    for (const email of entry.stacked) {
      if (!present.has(email)) return null;
      count += 1;
    }
  }

  return count === present.size ? [...plan] : null;
}

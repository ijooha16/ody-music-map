export function reactionRecipients(people: readonly { email: string }[], leaderEmail: string | null, riders: readonly { email: string }[]): string[] {
  const out = new Set<string>();
  for (const p of people) out.add(p.email);
  if (leaderEmail) out.add(leaderEmail);
  for (const r of riders) out.add(r.email);
  return [...out];
}

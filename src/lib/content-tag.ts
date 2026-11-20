import { createHash } from "node:crypto";

export function contentTag(items: readonly { musicId: number }[]): string {
  const sorted = [...items].sort((a, b) => a.musicId - b.musicId);
  const hash = createHash("sha1");
  for (const item of sorted) hash.update(JSON.stringify(item));
  return hash.digest("base64url").slice(0, 22);
}

export function matchesTag(ifNoneMatch: string | null | undefined, tag: string): boolean {
  if (!ifNoneMatch) return false;
  return ifNoneMatch.split(",").some((raw) => {
    const t = raw.trim();
    return t === "*" || t.replace(/^W\//, "").replace(/^"|"$/g, "") === tag;
  });
}

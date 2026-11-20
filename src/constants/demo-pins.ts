export interface DemoSong {
  id?: number;

  title: string;

  artist?: string | string[];

  minLayer?: number;
}

export const DEMO_SONGS: readonly DemoSong[] = [
  { title: "서쪽하늘", artist: "이승철" },
  { title: "그대에게", artist: "무한궤도" },
  { title: "Dynamite", artist: ["방탄소년단", "BTS"], minLayer: 1 },
  { title: "STEP", artist: ["카라", "KARA"], minLayer: 1 },
  { title: "Hollywood Action" },
  { title: "REDRED", artist: ["코르티스", "CORTIS"] },

  { id: 10000940, title: "ELEVEN", artist: ["아이브", "IVE"] },
  { title: "BAD", artist: ["에이티즈", "ATEEZ"] },
];

export const DEMO_PIN = {
  z: 1,

  coverGrow: 1.15,
} as const;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function hasWord(hay: string, word: string): boolean {
  if (!word) return false;
  const isChar = (c: string) => /[\p{L}\p{N}]/u.test(c);
  for (let i = hay.indexOf(word); i >= 0; i = hay.indexOf(word, i + 1)) {
    const before = i > 0 ? hay[i - 1] : "";
    const after = hay[i + word.length] ?? "";
    if (!isChar(before) && !isChar(after)) return true;
  }
  return false;
}

export function matchDemoSong<T extends { title: string; artist: string | null }>(want: DemoSong, items: readonly T[]): T | null {
  const title = norm(want.title);
  const artists = (Array.isArray(want.artist) ? want.artist : want.artist ? [want.artist] : []).map(norm);
  const byTitle = items.filter((it) => norm(it.title) === title);
  if (!byTitle.length) return null;
  if (!artists.length) return byTitle[0];
  const hit = byTitle.find((it) => {
    const a = norm(it.artist ?? "");
    return a.length > 0 && artists.some((w) => hasWord(a, w) || hasWord(w, a));
  });
  if (hit) return hit;
  return byTitle.length === 1 ? byTitle[0] : null;
}

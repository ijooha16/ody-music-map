import type { Id } from "@/types";

export interface MusicHint {
  title: string;
  artist: string | null;
}

export interface MusicHintInput {
  id: Id;
  title: string;
  artist?: string | null;
}

const MAX_HINTS = 512;

const hints = new Map<number, MusicHint>();
const listeners = new Set<() => void>();

export function rememberMusicHints(songs: readonly MusicHintInput[]): void {
  let changed = false;
  for (const song of songs) {
    if (!song?.title) continue;
    const artist = song.artist ?? null;
    const prev = hints.get(song.id);
    if (prev && prev.title === song.title && prev.artist === artist) continue;
    hints.set(song.id, { title: song.title, artist });
    changed = true;
  }
  if (!changed) return;

  while (hints.size > MAX_HINTS) hints.delete(hints.keys().next().value!);
  for (const listen of listeners) listen();
}

export function getMusicHint(musicId: number | null): MusicHint | undefined {
  return musicId == null ? undefined : hints.get(musicId);
}

export function getMusicHintOnServer(): undefined {
  return undefined;
}

export function subscribeMusicHints(listen: () => void): () => void {
  listeners.add(listen);
  return () => void listeners.delete(listen);
}

export function clearMusicHints(): void {
  hints.clear();
}

export function musicHintCount(): number {
  return hints.size;
}

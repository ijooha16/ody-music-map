import type { MusicHint } from "./music-hints";

export interface MusicLabel {
  title: string;
  artist: string | null;

  isHint: boolean;
}

export function resolveMusicLabel(
  musicId: number | null,
  detail: { title: string; artist: string | null } | undefined,
  hint: MusicHint | undefined,
): MusicLabel {
  if (detail) return { title: detail.title, artist: detail.artist, isHint: false };
  if (hint) return { title: hint.title, artist: hint.artist, isHint: true };
  return { title: musicId != null ? `Track ${musicId}` : "", artist: null, isHint: false };
}

export function panelFollowTarget(
  panel: { activePanel: string | null; musicId: number | null },
  prevMusicId: number | null,
  nextMusicId: number | null,
): number | null {
  if (nextMusicId == null || prevMusicId == null || prevMusicId === nextMusicId) return null;
  if (panel.activePanel !== "song" || panel.musicId !== prevMusicId) return null;
  return nextMusicId;
}

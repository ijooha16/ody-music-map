export interface SelectionFollowInput {
  playingMusicId: number | null;

  selectedMusicId: number | null;

  restored: boolean;

  riding: boolean;
}

export function shouldFollowPlayback({ playingMusicId, selectedMusicId, restored, riding }: SelectionFollowInput): boolean {
  if (playingMusicId == null || restored || riding) return false;
  return selectedMusicId !== playingMusicId;
}

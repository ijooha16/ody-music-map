export interface PlayerHandle {
  getCurrentTime: () => number;
  getDuration: () => number;

  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
}

let player: PlayerHandle | null = null;

export function registerPlayer(p: PlayerHandle | null) {
  player = p;
}

export function getPlayer(): PlayerHandle | null {
  return player;
}

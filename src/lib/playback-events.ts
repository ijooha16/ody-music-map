export interface PlaybackEvent {
  musicId: number;
  playSeq: number;
  state: "playing" | "paused" | "ended" | "unavailable";
  at: number;
}

const listeners = new Set<(event: PlaybackEvent) => void>();
export function reportPlayback(event: PlaybackEvent): void {
  listeners.forEach((listener) => listener(event));
}
export function subscribePlayback(listener: (event: PlaybackEvent) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export type PlayingAction =

  | "stop"

  | "silent"

  | "count";

export function playingAction(isPlaying: boolean, busy: boolean): PlayingAction {
  if (!isPlaying) return "stop";
  return busy ? "silent" : "count";
}

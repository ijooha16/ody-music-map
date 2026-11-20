import type { Email, Id, ISODateString } from "./common";

export const PLAY_SOURCES = ["MAP", "JOURNEY", "PLAYLIST", "FOLLOW"] as const;
export type PlaySource = (typeof PLAY_SOURCES)[number];

export interface PlayHistory {
  id: Id;

  musicId: Id;

  email: Email | null;

  source: PlaySource;

  playedMs: number;

  playedAt: ISODateString;
}

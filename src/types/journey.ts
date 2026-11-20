import type { Id } from "./common";
import type { Music } from "./music";

export interface JourneyRoute {
  startMusicId: Id;
  endMusicId: Id;

  stops: JourneyStop[];

  totalDuration: number;
}

export interface JourneyStop extends Pick<Music, "id" | "title" | "artist" | "duration"> {
  order: number;

  pc: number[];
}

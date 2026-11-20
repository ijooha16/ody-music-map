import type { Id } from "./common";
import type { Music } from "./music";
import type { Playlist } from "./playlist";

export interface MusicDetail extends Music {
  albumCoverUrl?: string | null;

  country?: string | null;

  language?: string | null;
  composer?: string | null;
  lyricist?: string | null;

  moods?: string[];

  principalComponents: { axis: number; value: number }[];

  nearby: Pick<Music, "id" | "title" | "artist">[];

  relatedPlaylists: Pick<Playlist, "id" | "playlistName" | "email">[];

  liked: boolean;
}

export interface MusicSearchResult {
  id: Id;
  title: string;
  artist: string | null;
}

export interface MusicSearchPage {
  items: MusicSearchResult[];

  page: number;
  hasNext: boolean;
}

export type SearchCondition =
  | { mode: "all"; query: string }
  | { mode: "artist"; artist: string; music: string }
  | { mode: "music"; music: string; artist: string };

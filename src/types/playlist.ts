import type { Email, Id, ISODateString } from "./common";
import type { Music } from "./music";

export interface Playlist {
  id: Id;

  email: Email;

  playlistName: string;

  likeCnt: number | null;

  createdAt: ISODateString;

  updatedAt: ISODateString;
}

export interface PlaylistItem {
  playlistId: Id;

  musicId: Id;

  addedAt: ISODateString | null;
}

export interface PlaylistItemWithMusic extends PlaylistItem {
  music: Music;
}

export interface PlaylistDetail extends Omit<Playlist, "email" | "createdAt" | "updatedAt"> {
  email: Email | null;
  createdAt: ISODateString | null;
  updatedAt: ISODateString | null;
  ownerNickname: string | null;

  moodTags: string[];
  itemCount: number;

  totalDuration: number;

  isLiked: boolean;
  items: PlaylistItemWithMusic[];
}

export type PlaylistSummary = Pick<Playlist, "id" | "playlistName" | "likeCnt"> & {
  itemCount: number;
  ownerNickname: string | null;
};

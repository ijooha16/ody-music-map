import type { Email, Id, ISODateString } from "./common";

export interface User {
  email: Email;

  name: string | null;

  nickname: string | null;

  tutorialCompleted: boolean;

  lastActiveAt: ISODateString | null;

  createdAt: ISODateString;

  updatedAt: ISODateString | null;

  imageUrl: string | null;
}

export interface Follow {
  id: Id;

  followerEmail: Email;

  followeeEmail: Email;

  createdAt: ISODateString;
}

export interface Meeting {
  user1: Email;

  user2: Email;

  cnt: number;
}

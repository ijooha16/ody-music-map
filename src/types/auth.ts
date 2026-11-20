import type { Email, Id, ISODateString } from "./common";

export interface RefreshToken {
  id: Id;
  email: Email;

  tokenHash: string;

  deviceId: string;

  expiresAt: ISODateString;
  createdAt: ISODateString;

  updatedAt: ISODateString;
}

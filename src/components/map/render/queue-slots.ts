import { NO_GENRE_ID } from "@/constants";
import { seedOf } from "@/lib/avatar-seed";
import type { NearbyUser } from "@/types";

export interface QueueInput {
  me: NearbyUser | null;
  riders: NearbyUser[];
  count: number;
}

export interface QueueSlot {
  user: NearbyUser;
  mine: boolean;
}

export function queueSlots({ me, riders, count }: QueueInput): QueueSlot[] {
  const out: QueueSlot[] = [];
  if (me) out.push({ user: me, mine: true });
  const known = riders.length > count ? riders.slice(riders.length - count) : riders;
  for (const r of known) out.push({ user: r, mine: false });
  for (let i = known.length; i < count; i++) out.push({ user: placeholderRider(i), mine: false });
  return out;
}

function placeholderRider(i: number): NearbyUser {
  const email = `rider-${i}`;
  return {
    email,
    nickname: null,
    imageUrl: null,
    isOnline: true,
    musicId: 0,
    viewingMusicId: 0,
    genreId: NO_GENRE_ID,
    meetingCount: 0,
    riderCount: 0,
    followingNickname: null,
    avatarSeed: seedOf(email),
  };
}

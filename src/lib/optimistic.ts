import type { ContestLeaderboard, Contest, PlaylistDetail, PlaylistItemWithMusic, PlaylistSummary, UserProfile, FollowListResponse, Music } from "@/types";

export function withFollow(profile: UserProfile | undefined, follow: boolean, role: "target" | "me"): UserProfile | undefined {
  if (!profile) return profile;
  const delta = follow ? 1 : -1;
  if (role === "me") return { ...profile, followingCount: Math.max(0, profile.followingCount + delta) };

  if (profile.isFollowing === follow) return profile;
  return { ...profile, isFollowing: follow, followerCount: Math.max(0, profile.followerCount + delta) };
}

export function withFollowInList(list: FollowListResponse | undefined, email: string, follow: boolean): FollowListResponse | undefined {
  if (!list) return list;
  return { ...list, content: list.content.map((u) => (u.email === email ? { ...u, isFollowing: follow } : u)) };
}

export function withPlaylistLike(detail: PlaylistDetail | undefined, liked: boolean): PlaylistDetail | undefined {
  if (!detail || detail.isLiked === liked) return detail;
  return { ...detail, isLiked: liked, likeCnt: Math.max(0, (detail.likeCnt ?? 0) + (liked ? 1 : -1)) };
}

export function withLikedPlaylist(list: PlaylistSummary[] | undefined, playlist: PlaylistDetail | undefined, playlistId: number, liked: boolean): PlaylistSummary[] | undefined {
  if (!list) return list;
  const rest = list.filter((p) => p.id !== playlistId);
  if (!liked) return rest;
  if (!playlist) return list;
  return [summaryOf(playlist), ...rest];
}

export function summaryOf(p: PlaylistDetail): PlaylistSummary {
  return { id: p.id, playlistName: p.playlistName, likeCnt: p.likeCnt, itemCount: p.itemCount, ownerNickname: p.ownerNickname };
}

export function withEntryLike(board: ContestLeaderboard | undefined, artworkId: number, liked: boolean): ContestLeaderboard | undefined {
  if (!board) return board;
  const target = board.items.find((e) => e.artworkId === artworkId);
  if (!target || target.likedByMe === liked) return board;
  return {
    ...board,
    round: withVotesLeft(board.round, liked)!,
    items: board.items.map((e) => (e.artworkId === artworkId ? { ...e, likedByMe: liked, likeCnt: Math.max(0, e.likeCnt + (liked ? 1 : -1)) } : e)),
  };
}

export function withVotesLeft(round: Contest | null | undefined, liked: boolean): Contest | null | undefined {
  if (!round || round.myVotesLeft == null) return round;
  return { ...round, myVotesLeft: Math.max(0, round.myVotesLeft + (liked ? -1 : 1)) };
}

export function withoutPlaylistItem(detail: PlaylistDetail | undefined, musicId: number): PlaylistDetail | undefined {
  if (!detail) return detail;
  const items = detail.items.filter((it) => it.musicId !== musicId);
  if (items.length === detail.items.length) return detail;
  return { ...detail, items, itemCount: Math.max(0, detail.itemCount - 1) };
}

export function withPlaylistItem(detail: PlaylistDetail | undefined, music: Music | undefined): PlaylistDetail | undefined {
  if (!detail || !music) return detail;
  if (detail.items.some((it) => it.musicId === music.id)) return detail;
  const item: PlaylistItemWithMusic = { playlistId: detail.id, musicId: music.id, addedAt: null, music };
  return { ...detail, items: [...detail.items, item], itemCount: detail.itemCount + 1 };
}

export function withItemCount(list: PlaylistSummary[] | undefined, playlistId: number, delta: number): PlaylistSummary[] | undefined {
  if (!list) return list;
  return list.map((p) => (p.id === playlistId ? { ...p, itemCount: Math.max(0, p.itemCount + delta) } : p));
}

export function withoutPlaylist(list: PlaylistSummary[] | undefined, playlistId: number): PlaylistSummary[] | undefined {
  if (!list) return list;
  return list.filter((p) => p.id !== playlistId);
}

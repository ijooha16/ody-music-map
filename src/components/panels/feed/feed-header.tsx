"use client";

import { useRef } from "react";
import { useDrill } from "@/hooks/use-drill";
import Avatar from "@/components/common/avatar";
import Button from "@/components/common/button";
import Note from "@/components/common/note";
import { useFollowMutation, useUnfollowMutation } from "@/hooks/mutations/use-follow-mutation";
import { useRideMutation } from "@/hooks/mutations/use-ride-mutation";
import { useSheetPeek } from "@/hooks/use-sheet-peek";
import { useSheetStop } from "@/hooks/use-sheet-stop";
import { useStartActivity } from "@/hooks/use-start-activity";
import { useFollowStore } from "@/stores/use-follow-store";
import type { UserProfile } from "@/types";

interface FeedHeaderProps {
  profile: UserProfile;
  isMe: boolean;

  onOpenFollows: (type: "follower" | "following") => void;
}

function StatInline({ label, value, onClick }: { label: string; value: number | string; onClick?: () => void }) {
  const body = (
    <>
      {label} <b className="num text-md normal-case tracking-normal text-ink">{value}</b>
    </>
  );
  if (!onClick) return <span className="lbl">{body}</span>;
  return (
    <button type="button" onClick={onClick} className="lbl cursor-pointer transition-colors duration-fast hover:text-ink">
      {body}
    </button>
  );
}

export default function FeedHeader({ profile, isMe, onOpenFollows }: FeedHeaderProps) {
  const leaderEmail = useFollowStore((s) => s.leaderEmail);
  const ride = useRideMutation();
  const follow = useFollowMutation();
  const unfollow = useUnfollowMutation();

  const drill = useDrill();
  const startActivity = useStartActivity();

  const actionsRef = useRef<HTMLDivElement>(null);
  useSheetStop(actionsRef);

  const statsRef = useRef<HTMLDivElement>(null);
  useSheetPeek(statsRef, "top");

  const isRiding = leaderEmail === profile.email;

  const isFollowing = profile.isFollowing;

  const online = isMe || profile.isOnline;
  const canRide = !isMe && online && !isRiding;

  const pending = follow.isPending || unfollow.isPending;
  const handleFollow = () => (isFollowing ? unfollow : follow).mutate(profile.email);

  const handleRide = () =>
    startActivity("follow", profile.email, () =>

      ride.mutate({ email: profile.email, nickname: profile.nickname, imageUrl: profile.imageUrl, musicId: profile.nowPlaying?.id ?? null }),
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Avatar src={profile.imageUrl} name={profile.nickname} size={56} online={online} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-semibold">{profile.nickname ?? profile.name ?? "익명"}</p>
          <p className="mt-[3px] text-[13.5px] text-ink-2">
            {online ? "접속 중" : "오프라인"} · {profile.daysSinceJoined}일째 탐험중
          </p>
          {profile.nowPlaying && (
            <button type="button" onClick={() => drill({ panel: "song", musicId: profile.nowPlaying!.id })} className="mt-0.5 block max-w-full truncate text-xs text-teal hover:underline">
              ♪ {profile.nowPlaying.title} — {profile.nowPlaying.artist ?? ""}
            </button>
          )}
        </div>
      </div>

      <div ref={statsRef} className="flex flex-wrap gap-3.5">

        <StatInline label="팔로워" value={profile.followerCount.toLocaleString()} onClick={profile.isBot ? undefined : () => onOpenFollows("follower")} />
        <StatInline label="팔로잉" value={profile.followingCount.toLocaleString()} onClick={() => onOpenFollows("following")} />
        {!isMe && <StatInline label="만남" value={`${profile.meetingCount ?? 0}회`} />}
      </div>

      {!isMe && (
        <div ref={actionsRef} className="flex flex-col gap-1.5 max-tablet:grid max-tablet:grid-cols-2 max-tablet:gap-2">

          <Button variant={isFollowing ? "secondary" : "primary"} onClick={handleFollow} disabled={pending}>
            {isFollowing ? "팔로잉" : "팔로우"}
          </Button>
          <Button variant="secondary" onClick={handleRide} disabled={!canRide || ride.isPending}>
            {isRiding ? "🚀 탑승 중" : "🚀 따라가기"}
          </Button>
          {!online && (
            <div className="max-tablet:col-span-2">
              <Note>오프라인이라 따라갈 수 없습니다.</Note>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

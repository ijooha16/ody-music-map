"use client";

import UserRow from "@/components/common/user-row";
import { useBackToMap } from "@/hooks/use-back-to-map";
import { useStartActivity } from "@/hooks/use-start-activity";
import { useRideMutation } from "@/hooks/mutations/use-ride-mutation";
import { useFollowStore } from "@/stores/use-follow-store";
import { useOpenProfile } from "@/hooks/use-open-profile";
import type { NearbyPerson } from "@/types";

export default function FriendRow({ person }: { person: NearbyPerson }) {
  const openProfile = useOpenProfile();
  const leaderEmail = useFollowStore((s) => s.leaderEmail);
  const ride = useRideMutation();
  const startActivity = useStartActivity();

  const backToMap = useBackToMap();

  const isRidingThis = leaderEmail === person.email;
  const handleRide = () =>
    startActivity("follow", person.email, () => {
      ride.mutate({ email: person.email, nickname: person.nickname, imageUrl: person.imageUrl, musicId: person.musicId });
      backToMap();
    });

  return (
    <UserRow
      nickname={person.nickname ?? "이름 없음"}
      imageUrl={person.imageUrl}
      onClick={() => {
        openProfile(person.email, { drill: true });
        backToMap();
      }}
      right={
        <div className="flex items-center gap-2">
          {person.meetingCount > 0 && <span className="num text-[14px] text-ink-3">{person.meetingCount}번째</span>}

          <button
            type="button"
            disabled={isRidingThis || ride.isPending}
            onClick={(e) => {
              e.stopPropagation();
              handleRide();
            }}
            className="shrink-0 rounded-pill border border-violet/35 bg-violet/[.14] px-3 py-1.5 text-[14px] text-ink-2 transition-colors hover:bg-violet/25 disabled:opacity-45"
          >
            {isRidingThis ? "탑승 중" : "🚀 따라가기"}
          </button>
        </div>
      }
    />
  );
}

"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import EmptyState from "@/components/common/empty-state";
import ErrorMessage from "@/components/common/error-message";
import SkeletonRows from "@/components/common/skeleton-rows";
import UserRow from "@/components/common/user-row";
import { useFollowListQuery } from "@/hooks/queries/use-follow-list-query";

type FollowType = "follower" | "following";

interface FeedFollowListProps {
  email: string;
  type: FollowType;

  isMe: boolean;

  onSelect: (email: string) => void;
}

const EMPTY: Record<FollowType, { me: string; other: string }> = {
  follower: { me: "아직 나를 팔로우한 사람이 없어요.", other: "아직 이 사람을 팔로우한 사람이 없어요." },
  following: { me: "아직 팔로우한 사람이 없어요.", other: "아직 아무도 팔로우하지 않았어요." },
};

export default function FeedFollowList({ email, type, isMe, onSelect }: FeedFollowListProps) {
  const [pages, setPages] = useState(1);

  return (
    <>
      {Array.from({ length: pages }, (_, i) => (
        <FollowPage
          key={i}
          email={email}
          type={type}
          page={i}
          isMe={isMe}
          first={i === 0}
          last={i === pages - 1}
          onMore={() => setPages((n) => n + 1)}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

interface FollowPageProps extends FeedFollowListProps {
  page: number;

  first: boolean;

  last: boolean;
  onMore: () => void;
}

function FollowPage({ email, type, page, isMe, first, last, onMore, onSelect }: FollowPageProps) {
  const { data, isPending, isError } = useFollowListQuery(email, type, page);

  if (isPending) return <SkeletonRows count={first ? 5 : 2} thumb="circle" sub={false} right={false} />;
  if (isError) return <ErrorMessage />;

  const people = data?.content ?? [];
  if (first && people.length === 0) return <EmptyState message={EMPTY[type][isMe ? "me" : "other"]} />;

  const showFollowing = !(isMe && type === "following");

  return (
    <>
      {people.map((p) => (
        <UserRow
          key={p.email}
          nickname={p.nickname ?? p.name}
          imageUrl={p.imageUrl}
          online={p.isOnline}
          right={showFollowing && p.isFollowing ? "팔로잉" : undefined}
          onClick={() => onSelect(p.email)}
        />
      ))}
      {last && data?.hasNext && (
        <Button size="sm" onClick={onMore} className="mt-1.5 self-center">
          더 보기
        </Button>
      )}
    </>
  );
}

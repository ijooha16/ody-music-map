"use client";

import EmptyState from "@/components/common/empty-state";
import UserRow from "@/components/common/user-row";
import { formatCount } from "@/lib/format";
import { useOpenProfile } from "@/hooks/use-open-profile";
import type { UserRankingItem } from "@/types";

interface UserRankingListProps {
  items: UserRankingItem[];

  unit: string;

  emptyMessage: string;
}

export default function UserRankingList({ items, unit, emptyMessage }: UserRankingListProps) {
  const openProfile = useOpenProfile();
  if (items.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <>
      {items.map((u) => (
        <UserRow key={u.email} prefix={u.rank} nickname={u.nickname} imageUrl={u.imageUrl} right={`${formatCount(u.score)} ${unit}`} onClick={() => openProfile(u.email, { drill: true })} />
      ))}
    </>
  );
}

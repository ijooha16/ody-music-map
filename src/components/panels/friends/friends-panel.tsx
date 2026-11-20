"use client";

import Box from "@/components/common/box";
import SkeletonRows from "@/components/common/skeleton-rows";
import { useNearbyPeopleQuery } from "@/hooks/queries/use-nearby-people-query";
import { useNearbyList } from "@/hooks/use-nearby-list";
import { useNearbyPeopleLive } from "@/hooks/use-nearby-people-live";
import { useRealtimeConnected } from "@/hooks/use-realtime-connected";
import { useFollowStore } from "@/stores/use-follow-store";
import PanelBackButton from "../panel-back-button";
import PanelCloseButton from "../panel-close-button";
import FriendRow from "./friend-row";
import NearbyRadar from "./nearby-radar";
import ReactionButton from "./reaction-button";

export default function FriendsPanel() {
  const connected = useRealtimeConnected();

  const riding = useFollowStore((s) => s.leaderEmail != null);
  const live = connected && !riding;
  const { data, isLoading, error, refetch } = useNearbyPeopleQuery(live);

  useNearbyPeopleLive(live, refetch);

  const people = useNearbyList(data?.people, true);

  const code = (error as { code?: string } | null)?.code;

  const noPlay = code === "PRESENCE_ERROR";

  const notice = riding
    ? "따라가는 중이라 인솔자 곡 주변을 보고 있어요."
    : noPlay
    ? "곡을 먼저 재생하면 비슷한 곡을 듣는 사람이 보여요."
    : people.length === 0
      ? "지금 가까이에 있는 사람이 없어요."
      : null;

  const empty = people.length === 0 && !(connected && isLoading);

  return (
    <Box lead={<PanelBackButton />} title="주변 사람" actions={<PanelCloseButton />}>

      <div className={empty ? "my-auto flex flex-col gap-3.5" : "contents"}>
        <div className="relative">
          <NearbyRadar people={people} />

          <div className="absolute right-0 bottom-0 z-20">
            <ReactionButton people={people} />
          </div>
        </div>

        <div className="flex h-9 items-center justify-center">
          {notice && (
            <div className="glass-liquid animate-tin flex items-center gap-2 rounded-pill! px-3.5 py-2 text-center text-[13.5px] text-ink-2 shadow-[0_8px_28px_-10px_#000]">
              {notice}
            </div>
          )}
        </div>
      </div>

      {!empty && (
        <div className="scroll-quiet -mx-1.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">

          {connected && isLoading && <SkeletonRows count={4} thumb="circle" />}

          {people.map((p) => <FriendRow key={p.email} person={p} />)}
        </div>
      )}
    </Box>
  );
}

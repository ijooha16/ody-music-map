"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Box from "@/components/common/box";
import Divider from "@/components/common/divider";
import ErrorMessage from "@/components/common/error-message";
import IconButton from "@/components/common/icon-button";
import UnderlineTabs from "@/components/common/underline-tabs";
import { BackIcon } from "@/components/common/icons";
import { ROUTES } from "@/constants";
import { useMeQuery } from "@/hooks/queries/use-me-query";
import { useUserProfileQuery } from "@/hooks/queries/use-user-profile-query";
import { usePanelStore, type FollowType } from "@/stores/use-panel-store";
import PanelBackButton from "../panel-back-button";
import PanelCloseButton from "../panel-close-button";
import FeedDashboard from "./feed-dashboard";
import FeedFollowList from "./feed-follow-list";
import FeedHeader from "./feed-header";
import FeedMenu from "./feed-menu";
import FeedPlaylists from "./feed-playlists";
import FeedSkeleton from "./feed-skeleton";
import FeedTasteReport from "./feed-taste-report";

const FOLLOW_TITLE: Record<FollowType, string> = { follower: "팔로워", following: "팔로잉" };

type FeedTab = "taste" | "made" | "liked";
const MY_TABS = [
  { key: "made", label: "내 플리" },
  { key: "liked", label: "좋아요한 플리" },
  { key: "taste", label: "내 음악 취향" },
] as const satisfies ReadonlyArray<{ key: FeedTab; label: string }>;
const OTHER_TABS = [
  { key: "made", label: "플레이리스트" },
  { key: "liked", label: "좋아요한 플리" },
] as const satisfies ReadonlyArray<{ key: FeedTab; label: string }>;

interface FeedPanelProps {
  self?: boolean;
}

export default function FeedPanel({ self = false }: FeedPanelProps) {
  const storeEmail = usePanelStore((s) => s.profileEmail);
  const drill = usePanelStore((s) => s.drill);
  const router = useRouter();
  const profileEmail = self ? null : storeEmail;
  const { data: me } = useMeQuery();
  const targetEmail = profileEmail ?? me?.email ?? null;
  const isMe = !profileEmail || profileEmail === me?.email;
  const { data, isPending, isError } = useUserProfileQuery(targetEmail);

  const [tabChoice, setTabChoice] = useState<FeedTab | null>(null);
  const tabs = isMe ? MY_TABS : OTHER_TABS;
  const tab: FeedTab = tabChoice && tabs.some((t) => t.key === tabChoice) ? tabChoice : "made";

  const storeFollows = usePanelStore((s) => s.feedFollows);
  const openFollows = usePanelStore((s) => s.openFollows);
  const closeFollows = usePanelStore((s) => s.closeFollows);
  const follows: FollowType | null = self && storeEmail != null ? null : storeFollows;

  const selectUser = (email: string) => {
    if (self) {
      usePanelStore.getState().openFeed(email);
      usePanelStore.setState({ history: [{ panel: "feed", profileEmail: null, follows }] }, false, "drill/fromMe");
      router.push(ROUTES.home);
      return;
    }
    drill({ panel: "feed", profileEmail: email });
  };

  return (
    <Box
      title={follows ? FOLLOW_TITLE[follows] : isMe ? "마이페이지" : "프로필"}
      lead={
        follows ? (
          <IconButton label="프로필로 돌아가기" onClick={closeFollows}>
            <BackIcon />
          </IconButton>
        ) : (
          !self && <PanelBackButton />
        )
      }

      actions={
        <>
          {isMe && !follows && <FeedMenu />}
          <PanelCloseButton />
        </>
      }
    >
      {follows && targetEmail ? (
        <div className="-mx-1.5 flex flex-col gap-0.5">
          <FeedFollowList email={targetEmail} type={follows} isMe={isMe} onSelect={selectUser} />
        </div>
      ) : (
        <>
          {isPending && <FeedSkeleton />}
          {isError && <ErrorMessage />}
          {data && (
            <>
              <FeedHeader profile={data} isMe={isMe} onOpenFollows={(type) => (self ? usePanelStore.setState({ feedFollows: type }, false, "openFollows/me") : openFollows(type))} />
              <Divider />
              <FeedDashboard dashboard={data.dashboard} />
              <Divider />
              <UnderlineTabs items={tabs} value={tab} onChange={setTabChoice} />

              <div className="scroll-quiet -mx-[15px] -mb-[18px] flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-[15px] pb-[18px] max-tablet:-mx-gutter-sm max-tablet:px-gutter-sm">

              {tab === "taste" && isMe && me && <FeedTasteReport />}

              {tab === "made" && <FeedPlaylists email={targetEmail} isMe={isMe} kind="made" />}
              {tab === "liked" && <FeedPlaylists email={targetEmail} isMe={isMe} kind="liked" />}
              </div>
            </>
          )}
        </>
      )}
    </Box>
  );
}

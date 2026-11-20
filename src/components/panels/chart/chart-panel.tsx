"use client";

import { useState } from "react";
import Box from "@/components/common/box";
import ErrorMessage from "@/components/common/error-message";
import Note from "@/components/common/note";
import SectionTitle from "@/components/common/section-title";
import SkeletonRows from "@/components/common/skeleton-rows";
import UnderlineTabs from "@/components/common/underline-tabs";
import { CHART_TYPES, type ChartType } from "@/constants";
import { useTopDriverRankingQuery } from "@/hooks/queries/use-top-driver-ranking-query";
import { useWeeklyRankingQuery } from "@/hooks/queries/use-weekly-ranking-query";
import PanelBackButton from "../panel-back-button";
import PanelCloseButton from "../panel-close-button";
import TopDriverAside from "./top-driver-aside";
import UserRankingList from "./user-ranking-list";

const TAB_ITEMS = CHART_TYPES.map((c) => ({ key: c.key, label: c.short }));

const md = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function ChartPanel() {
  const [type, setType] = useState<ChartType>("discovery");
  const current = CHART_TYPES.find((c) => c.key === type)!;
  const isTopDriver = type === "topDriver";
  const weekly = useWeeklyRankingQuery();
  const topDriver = useTopDriverRankingQuery(isTopDriver);

  const range = weekly.data ? `${md(weekly.data.weekStart)} ~ ${md(new Date(new Date(weekly.data.weekEnd).getTime() - 86_400_000).toISOString())}` : null;

  const { isPending, isError } = isTopDriver ? topDriver : weekly;
  const items = isTopDriver ? topDriver.data : weekly.data?.[type as Exclude<ChartType, "topDriver">];
  const aside = isTopDriver ? (
    <TopDriverAside updatedAt={topDriver.dataUpdatedAt} fetching={topDriver.isFetching && !topDriver.isPending} onRefresh={() => void topDriver.refetch()} />
  ) : (
    range ?? undefined
  );

  return (
    <Box lead={<PanelBackButton />} title="차트" actions={<PanelCloseButton />}>

      <UnderlineTabs items={TAB_ITEMS} value={type} onChange={setType} />
      <SectionTitle aside={aside}>{current.label}</SectionTitle>

      <div className="scroll-quiet -mx-[15px] -mb-[18px] flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-[15px] pb-[18px] max-tablet:-mx-gutter-sm max-tablet:px-gutter-sm">
        <div className="-mx-1.5 flex flex-col gap-0.5">
          {isPending ? (
            <SkeletonRows count={5} thumb="circle" sub={false} />
          ) : isError || !items ? (
            <ErrorMessage />
          ) : (
            <UserRankingList items={items} unit={current.unit} emptyMessage={current.empty} />
          )}
        </div>
        <Note>{current.description}</Note>
      </div>
    </Box>
  );
}

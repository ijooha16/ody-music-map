"use client";

import Button from "@/components/common/button";
import Note from "@/components/common/note";
import SectionTitle from "@/components/common/section-title";
import Skeleton from "@/components/common/skeleton";
import Tag from "@/components/common/tag";
import { useGenerateTasteAnalysisMutation } from "@/hooks/mutations/use-generate-taste-analysis-mutation";
import { useTasteAnalysisQuery } from "@/hooks/queries/use-taste-analysis-query";
import { tasteView } from "@/lib/taste-view";

export default function FeedTasteReport() {
  const { data, isPending, isError } = useTasteAnalysisQuery();
  const generate = useGenerateTasteAnalysisMutation();

  if (isError) return null;
  if (isPending) return <Skeleton h={44} rounded="box" />;
  if (!data) return null;

  const view = tasteView(data);
  const { report } = view;

  const busy = generate.isPending || view.generating;

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle
        aside={
          report
            ? `좋아요 ${data.counts.valid.toLocaleString()}곡 기준`
            : data.counts.totalLiked > 0
              ? `좋아요 ${data.counts.totalLiked.toLocaleString()}곡`
              : undefined
        }
      >
        음악 취향
      </SectionTitle>

      {report ? (
        <>

          <p className={`font-display text-[17px] leading-snug font-medium ${view.stale ? "text-ink-2" : "text-ink"}`}>
            {view.badge && (
              <span
                title={view.badge.title}
                className="mr-1.5 inline-block translate-y-[-2px] rounded-pill border border-warn/30 bg-warn/[.07] px-1.5 py-px align-middle text-2xs font-medium text-warn"
              >
                {view.badge.text}
              </span>
            )}
            {report.summary}
          </p>

          {view.tags.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {view.tags.map((t) => (
                <li key={t.id}>
                  <Tag tone={t.strength === "strong" ? "teal" : "default"} title={t.title}>
                    {t.text}
                  </Tag>
                </li>
              ))}
            </ul>
          )}
          {report.narratives.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {report.narratives.map((n) => (
                <li key={n.findingId} className="text-sm leading-relaxed text-ink-3">
                  {n.text}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <Note>좋아요한 곡을 모아 <b>어떤 소리를 좋아하는지</b> 읽어 드려요.</Note>
      )}

      <div className="flex items-center justify-between gap-2">
        {view.notice ? <span className="min-w-0 flex-1 text-[14px] text-ink-4">{view.notice}</span> : <span className="flex-1" />}
        <Button
          size="sm"
          variant={report ? "secondary" : "primary"}
          disabled={!view.canGenerate || busy}
          onClick={() => generate.mutate()}
          className="shrink-0"
        >
          {busy ? "만드는 중" : view.buttonLabel}
        </Button>
      </div>
    </section>
  );
}

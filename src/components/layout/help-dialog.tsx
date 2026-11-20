"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Box from "@/components/common/box";
import Button from "@/components/common/button";
import { ChevronLeftIcon, CloseIcon } from "@/components/common/icons";
import IconButton from "@/components/common/icon-button";
import { NEARBY_COUNT, ROUTES, STORAGE_KEYS } from "@/constants";
import { useSurveyMode } from "@/hooks/use-survey-mode";
import { useSwipePager } from "@/hooks/use-swipe-pager";
import { removeStorage } from "@/lib/storage";

interface GuideCard {
  key: string;
  icon: string;
  title: string;
  body: string;

  clip: string;
}

function guideCards(): GuideCard[] {
  return [
    {
      key: "map",
      icon: "🗺️",
      title: "별지도",
      clip: "/guide/map.mp4",

      body: "별 하나가 곡 하나예요. 한 번 누르면 **곡 정보**가 열려요.\n한 번 더 누르면 **재생**되고, 내 위치가 그 별로 옮겨가요.",
    },
    {
      key: "drill",
      icon: "🔍",
      title: "파고들기",
      clip: "/guide/drill.mp4",
      body: "계속 확대하면 다음 레이어로 **파고들어요**.\n새 축 2개가 추가되며 좌표가 재정렬돼요.",
    },
    {
      key: "nearby",
      icon: "📡",
      title: "주변 탐색",
      clip: "/guide/nearby.mp4",
      body: `고른 곡과 소리가 가장 가까운 **${NEARBY_COUNT}곡**을 선으로 이어줘요.`,
    },
    {
      key: "journey",
      icon: "🧭",
      title: "여정",
      clip: "/guide/journey.mp4",
      body: "출발 곡과 도착 곡을 정하면 그 사이를 잇는 **경로**가 나와요.\n별을 하나씩 이동하며 소리의 변화에 집중해보세요.",
    },
    {
      key: "follow",
      icon: "🚀",
      title: "따라가기",
      clip: "/guide/follow.mp4",
      body: "다른 사람의 우주선에 **탑승**해 탐색 여정을 함께해요. 탑승 중엔 지도 조작이 잠기고 **하차** 버튼으로 내릴 수 있어요.",
    },
  ];
}

function emphasize(body: string) {
  return body.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-medium text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

export default function HelpDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const cards = guideCards();
  const [at, setAt] = useState(0);
  const last = cards.length - 1;
  const go = useCallback((d: number) => setAt((v) => Math.min(last, Math.max(0, v + d))), [last]);

  const swipe = useSwipePager(go);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const surveyMode = useSurveyMode();
  const pathname = usePathname();
  const replayGuide = () => {
    removeStorage(STORAGE_KEYS.testGuideSeen);

    if (pathname === ROUTES.tutorial) window.location.reload();
    else router.push(ROUTES.tutorial);
  };

  const card = cards[Math.min(at, last)];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-tin w-full max-w-md">

        <Box
          title={`${card.icon} ${card.title}`}
          actions={
            <IconButton label="닫기" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          }
          footer={
            <div className="flex flex-col gap-3">

              <div className="flex items-center justify-between">
                <IconButton label="이전" className="disabled:pointer-events-none disabled:opacity-25" onClick={() => go(-1)} disabled={at === 0}>
                  <ChevronLeftIcon />
                </IconButton>
                <div className="flex gap-1.5">
                  {cards.map((c, i) => (
                    <button
                      key={c.key}
                      aria-label={`${i + 1}번째 ${c.title}`}
                      onClick={() => setAt(i)}
                      className={`h-1.5 rounded-pill transition-all ${i === at ? "w-4 bg-ink" : "w-1.5 bg-line-2 hover:bg-ink-3"}`}
                    />
                  ))}
                </div>
                <IconButton label="다음" className="disabled:pointer-events-none disabled:opacity-25" onClick={() => go(1)} disabled={at === last}>
                  <span className="block rotate-180">
                    <ChevronLeftIcon />
                  </span>
                </IconButton>
              </div>

              <div className="flex gap-2">

                {surveyMode && (
                  <Button className="flex-1" onClick={replayGuide}>
                    가이드 다시보기
                  </Button>
                )}
                <Button className="flex-1" onClick={() => router.push(ROUTES.tutorial)}>
                  튜토리얼 다시보기
                </Button>
              </div>
            </div>
          }
        >

          <div key={card.key} {...swipe} className="animate-tfade flex touch-pan-y flex-col gap-2.5">

            <div className="relative aspect-video w-full overflow-hidden rounded-box-sm border border-line bg-void-2">
              <video
                src={card.clip}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <p className="text-md leading-relaxed whitespace-pre-line text-ink-2">{emphasize(card.body)}</p>
          </div>
        </Box>
      </div>
    </div>
  );
}

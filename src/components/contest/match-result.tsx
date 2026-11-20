import Note from "@/components/common/note";
import SectionTitle from "@/components/common/section-title";
import Tag from "@/components/common/tag";
import TrackRow from "@/components/common/track-row";
import { MATCH_QUALITY_LABEL } from "@/constants";
import type { ContestMatch } from "@/types";

const TONE = { HIGH: "teal", MEDIUM: "violet", LOW: "warn" } as const;

interface MatchResultProps {
  match: ContestMatch;
  className?: string;

  onHover?: (index: number | null) => void;

  showNote?: boolean;
}

export default function MatchResult({ match, className = "", onHover, showNote = true }: MatchResultProps) {
  const tpl = match.template;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <SectionTitle aside={<Tag tone={TONE[match.quality]}>{MATCH_QUALITY_LABEL[match.quality]}</Tag>}>
        이 별자리에 들어갈 곡 {match.tracks.length}개
      </SectionTitle>
      {showNote && <Note>
        {tpl
          ? `AI 추천 「${tpl.label}」 모양대로 고른 곡이에요. 플레이리스트 「${tpl.playlistName}」은 이미 만들어졌고, 출품하면 아래에 적은 이름으로 바뀌어요.`
          : "점을 찍은 순서대로 한 점에 한 곡씩 골랐어요. 번호가 캔버스의 별 번호예요. 출품하면 이 곡들로 플레이리스트가 만들어져요."}
        {!tpl && match.quality === "LOW" && " 점을 고쳐 다시 찾아볼 수 있어요 — 이대로 출품해도 돼요."}
      </Note>}
      <div className="scroll-quiet -mx-1.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto" onMouseLeave={() => onHover?.(null)}>
        {match.tracks.map((t, i) => (
          <div key={t.musicId} onMouseEnter={() => onHover?.(i)}>
            <TrackRow index={i + 1} title={t.title ?? "알 수 없는 곡"} artist={t.artist} />
          </div>
        ))}
      </div>
    </div>
  );
}

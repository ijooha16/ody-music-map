"use client";

import { useRef, useState } from "react";
import { CalendarIcon, ClockIcon, HeartIcon, PauseIcon, PlaylistAddIcon, PlayIcon } from "@/components/common/icons";
import MarqueeText from "@/components/common/marquee-text";
import Tag from "@/components/common/tag";
import TransportButton from "@/components/common/transport-button";
import { PLAYBACK_BLOCKED } from "@/constants";
import { useLikeMusicMutation } from "@/hooks/mutations/use-like-music-mutation";
import { useFeatures } from "@/hooks/use-features";
import { useSheetPeek } from "@/hooks/use-sheet-peek";
import { useSongPlayToggle } from "@/hooks/use-song-play-toggle";
import { formatCount, formatDuration } from "@/lib/format";
import type { MusicDetail } from "@/types";
import AddToPlaylistDialog from "../playlist/add-to-playlist-dialog";

export default function SongHeader({ music }: { music: MusicDetail }) {
  const features = useFeatures();
  const [menuOpen, setMenuOpen] = useState(false);

  const { blocked, isThisPlaying, toggle } = useSongPlayToggle(music.id);
  const like = useLikeMusicMutation();

  const titleRowRef = useRef<HTMLDivElement>(null);
  useSheetPeek(titleRowRef, "bottom");

  const dead = blocked === PLAYBACK_BLOCKED.noVideo;
  return (
    <div className="relative flex flex-col gap-2">
      <div ref={titleRowRef} className="flex items-center gap-1.5">

        <div className="mr-1 flex min-w-0 flex-1 flex-col gap-0.5">
          <MarqueeText
            text={music.title}
            className="font-display text-3xl leading-[1.2] font-semibold text-ink drop-shadow-[0_2px_8px_rgba(4,6,13,.85)]"
          />
          <MarqueeText text={music.artist ?? "Unknown"} className="text-sm text-ink-2 drop-shadow-[0_1px_6px_rgba(4,6,13,.9)]" />

          {music.album && (
            <span data-sheet-album>
              <MarqueeText text={music.album} className="text-xs text-ink-3 drop-shadow-[0_1px_6px_rgba(4,6,13,.9)]" />
            </span>
          )}
        </div>

        <TransportButton label={music.liked ? "좋아요 취소" : "좋아요"} size="md" bright onClick={() => like.mutate({ musicId: music.id, liked: !music.liked })}>
          <HeartIcon size={18} filled={music.liked} className={music.liked ? "text-rose-400" : undefined} />
        </TransportButton>

        {features.playlist && (
          <TransportButton label={dead ? "재생할 수 없는 곡은 담을 수 없어요" : "플레이리스트에 추가"} size="md" bright disabled={dead} onClick={() => setMenuOpen(true)}>
            <PlaylistAddIcon size={18} />
          </TransportButton>
        )}
        <TransportButton label={dead ? "재생할 수 없는 곡이에요" : isThisPlaying ? "정지" : "재생"} primary disabled={dead} dimmed={!dead && !!blocked} onClick={toggle}>
          {isThisPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
        </TransportButton>
      </div>

      <div data-sheet-chips className="flex flex-wrap gap-[5px]">

        {(music.moods ?? []).map((m) => (
          <Tag key={m} tone="teal" title="무드">
            {m}
          </Tag>
        ))}

        <Tag tone="violet" title="누적 재생">
          ▶ {formatCount(music.playCnt)}
        </Tag>
        <Tag title="곡 길이">
          <ClockIcon /> {formatDuration(music.duration)}
        </Tag>

        {music.releaseYear != null && (
          <Tag title="발매년도">
            <CalendarIcon /> {music.releaseYear}
          </Tag>
        )}

        {blocked && (
          <Tag tone="warn" title={blocked.notice}>
            {blocked.badge}
          </Tag>
        )}
      </div>
      {features.playlist && menuOpen && <AddToPlaylistDialog musicId={music.id} onDone={() => setMenuOpen(false)} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import IconButton from "@/components/common/icon-button";
import { SirenIcon } from "@/components/common/icons";
import { PLAYBACK_BLOCKED } from "@/constants";
import { usePlayability } from "@/hooks/queries/use-video-id-query";
import SongReportDialog from "./song-report-dialog";

export default function SongReportButton({ musicId, title }: { musicId: number; title: string }) {
  const [open, setOpen] = useState(false);
  const { blocked } = usePlayability(musicId);
  return (
    <>

      <IconButton label="이 곡 신고" onClick={() => setOpen(true)} active={open} className="text-bad! hover:brightness-125">
        <SirenIcon />
      </IconButton>
      {open && <SongReportDialog musicId={musicId} title={title} unplayable={blocked === PLAYBACK_BLOCKED.noVideo} onClose={() => setOpen(false)} />}
    </>
  );
}

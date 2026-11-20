"use client";

import { useRef } from "react";
import { useAlbumCover } from "@/hooks/use-album-cover";
import { COVER_SHADE, canvasLuma, shadeForLuma } from "@/lib/cover-shade";

const BACKDROP_PX = 256;

export default function PlayerBackdrop({ musicId }: { musicId: number | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  useAlbumCover(ref, musicId, BACKDROP_PX, (canvas) => {
    const luma = canvasLuma(canvas);
    if (shadeRef.current) shadeRef.current.style.opacity = String(luma == null ? COVER_SHADE.max : shadeForLuma(luma));
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] max-tablet:hidden">
      <div ref={ref} className="absolute inset-0 scale-125 bg-cover bg-center" />
      <div className="absolute inset-0 backdrop-blur-md" />
      <div ref={shadeRef} className="absolute inset-0 bg-void transition-opacity duration-300" style={{ opacity: COVER_SHADE.max }} />
      <div className="absolute inset-0 bg-gradient-to-t from-void/70 via-void/25 to-transparent" />
    </div>
  );
}

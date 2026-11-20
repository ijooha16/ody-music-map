"use client";

import { useEffect, useRef, useState } from "react";
import { NO_GENRE_ID } from "@/constants";
import { genreRgb } from "@/constants/design-tokens";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { drawHelmet, drawVisor } from "@/components/map/render/draw-friends";
import { onPhotoLoaded } from "@/lib/avatar-photo";
import { seedOf } from "@/lib/avatar-seed";
import type { NearbyUser } from "@/types";

interface HelmetAvatarProps {
  email: string;

  imageUrl?: string | null;

  musicId?: number | null;
  size?: number;
  online?: boolean;

  hot?: boolean;
}

export default function HelmetAvatar({ email, imageUrl, musicId, size = 40, online = false, hot = false }: HelmetAvatarProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => onPhotoLoaded(() => setTick((v) => v + 1)), []);

  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = canvas.height = Math.round(size * dpr);
    const g = canvas.getContext("2d");
    if (!g) return;
    g.scale(dpr, dpr);

    const R = size / 3.1;
    const c = size / 2;
    const user = {
      email,
      imageUrl: imageUrl ?? null,
      genreId: (musicId != null ? getMapEngine()?.genreOf(musicId) : null) ?? NO_GENRE_ID,
      avatarSeed: seedOf(email),
    } as NearbyUser;

    drawHelmet(g, c, c, R, genreRgb(user.genreId), hot);
    drawVisor(g, c, c, R, user);
    if (!online) return;

    g.beginPath();
    g.arc(c + R * 0.82, c + R * 0.82, 2.9, 0, 6.284);
    g.fillStyle = "#4fe3ce";
    g.fill();
    g.strokeStyle = "#02040a";
    g.lineWidth = 1.3;
    g.stroke();
  }, [email, imageUrl, musicId, size, online, hot, tick]);

  return <canvas ref={ref} aria-hidden className="shrink-0" style={{ width: size, height: size }} />;
}

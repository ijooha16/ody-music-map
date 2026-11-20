"use client";

import HelmetAvatar from "@/components/common/helmet-avatar";
import { RADAR } from "@/constants";
import { useMeQuery } from "@/hooks/queries/use-me-query";
import { layerPointOf } from "@/lib/layer-point";
import type { Point } from "@/lib/nearby-from-layer";
import { useMapStore } from "@/stores/use-map-store";
import { useOpenProfile } from "@/hooks/use-open-profile";
import type { NearbyPerson } from "@/types";

export const angleOf = (i: number, total: number) => (i / Math.max(1, total)) * Math.PI * 2 - Math.PI / 2;

export function bearingOf(me: Point | null, at: Point | null): number | null {
  if (!me || !at) return null;
  return Math.atan2(-(at.y - me.y), at.x - me.x);
}

const SPREAD_GAP = 3;

const SPREAD_PASSES = 8;

export function spreadApart(items: readonly { x: number; y: number; d: number }[], bound: number): { x: number; y: number }[] {
  const out = items.map((it) => ({ x: it.x, y: it.y }));

  const groups = new Map<string, number[]>();
  out.forEach((p, i) => {
    const key = `${Math.round(p.x)},${Math.round(p.y)}`;
    const at = groups.get(key);
    if (at) at.push(i);
    else groups.set(key, [i]);
  });
  for (const idx of groups.values()) {
    if (idx.length < 2) continue;
    const need = Math.max(...idx.map((i) => items[i].d)) + SPREAD_GAP;

    const r0 = need / (2 * Math.sin(Math.PI / idx.length));
    idx.forEach((i, k) => {
      const a = (k / idx.length) * Math.PI * 2 - Math.PI / 2;
      out[i] = { x: out[i].x + Math.cos(a) * r0, y: out[i].y + Math.sin(a) * r0 };
    });
  }

  for (let pass = 0; pass < SPREAD_PASSES; pass++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const need = (items[i].d + items[j].d) / 2 + SPREAD_GAP;
        let dx = out[j].x - out[i].x;
        let dy = out[j].y - out[i].y;
        let dist = Math.hypot(dx, dy);
        if (dist >= need) continue;
        if (dist < 1e-6) {
          const a = ((i * 2 + j) * Math.PI * 2) / Math.max(1, out.length * 2);
          dx = Math.cos(a);
          dy = Math.sin(a);
          dist = 1;
        }
        const push = (need - dist) / 2 / dist;
        out[i].x -= dx * push;
        out[i].y -= dy * push;
        out[j].x += dx * push;
        out[j].y += dy * push;
        moved = true;
      }
    }
    if (!moved) break;
  }

  return out.map((p, i) => {
    const max = Math.max(0, bound - items[i].d / 2);
    const dist = Math.hypot(p.x, p.y);
    if (dist <= max || dist < 1e-6) return p;
    const k = max / dist;
    return { x: p.x * k, y: p.y * k };
  });
}

export function radiusOf(distance: number, max: number): number {
  if (!(max > 0)) return RADAR.ringMin;
  const t = Math.min(1, Math.max(0, distance / max));
  return RADAR.ringMin + t * (RADAR.ringMax - RADAR.ringMin);
}

export function sizeOf(meetingCount: number, max: number): number {
  if (!(max > 0)) return RADAR.sizeMin;
  const t = Math.min(1, Math.max(0, meetingCount / max));
  return Math.round(RADAR.sizeMin + t * (RADAR.sizeMax - RADAR.sizeMin));
}

export default function NearbyRadar({ people }: { people: NearbyPerson[] }) {
  const openProfile = useOpenProfile();
  const { data: me } = useMeQuery();

  const myMusicId = useMapStore((s) => s.myMusicId);
  const layer = useMapStore((s) => s.layer);

  const me0 = layerPointOf(myMusicId, layer);

  const maxDistance = Math.max(...people.map((p) => p.distance).filter(Number.isFinite), 0);
  const maxMeeting = Math.max(...people.map((p) => p.meetingCount), 0);
  const R = RADAR.size / 2;

  const sizes = people.map((p) => sizeOf(p.meetingCount, maxMeeting));
  const spots = spreadApart(
    people.map((p, i) => {
      const at = p.x != null && p.y != null ? { x: p.x, y: p.y } : layerPointOf(p.musicId, layer);
      const a = bearingOf(me0, at) ?? angleOf(i, people.length);
      const r = radiusOf(p.distance, maxDistance) * R;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, d: sizes[i] };
    }),
    R,
  );

  return (
    <div className="relative mx-auto" style={{ width: RADAR.size, height: RADAR.size }} aria-label="주변 사람 레이더">

      <svg width={RADAR.size} height={RADAR.size} className="absolute inset-0" aria-hidden>
        {[1, 0.66, 0.33].map((k) => (
          <circle key={k} cx={R} cy={R} r={R * k * 0.92} fill="none" stroke="currentColor" className="text-line" />
        ))}
      </svg>

      <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          className="animate-radar-sweep rounded-pill"
          style={{
            width: RADAR.size * 0.92,
            height: RADAR.size * 0.92,
            background: "conic-gradient(from 0deg, rgb(79 227 206 / 0.20), rgb(79 227 206 / 0.05) 22deg, transparent 58deg)",
          }}
        />
      </span>

      <span className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          className="animate-breathe grid place-items-center rounded-pill p-[3px] shadow-[0_0_18px_-2px_rgba(79,227,206,.8)] ring-2 ring-teal/80"
          style={{ ["--breathe-hi" as string]: 1.12, animationDuration: "1.9s" }}
        >
          <HelmetAvatar email={me?.email ?? "me"} imageUrl={me?.imageUrl} musicId={myMusicId} size={RADAR.sizeMax} />
        </span>
      </span>

      {people.map((p, i) => {
        const d = sizes[i];
        const spot = spots[i];

        const breathes = maxMeeting > 0 && p.meetingCount >= maxMeeting * RADAR.breatheFrom;
        return (
          <button
            key={p.email}
            type="button"
            onClick={() => openProfile(p.email, { drill: true })}
            title={`${p.nickname ?? "이름 없음"}${p.meetingCount > 0 ? ` · ${p.meetingCount}번 마주침` : ""}`}
            className={`absolute grid place-items-center rounded-pill transition-opacity hover:opacity-80 ${breathes ? "animate-breathe" : ""}`}
            style={{
              width: d,
              height: d,
              left: R + spot.x,
              top: R + spot.y,
              marginLeft: -d / 2,
              marginTop: -d / 2,

              animationDuration: breathes ? `${2.2 + (i % 5) * 0.35}s` : undefined,
            }}
          >

            <HelmetAvatar email={p.email} imageUrl={p.imageUrl} musicId={p.musicId} size={d} online />
          </button>
        );
      })}

    </div>
  );
}

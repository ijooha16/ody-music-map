"use client";

import { useMemo } from "react";
import { LAYER_USERS } from "@/constants";
import { useLayerUsersQuery } from "@/hooks/queries/use-layer-users-query";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { layerPointOf } from "@/lib/layer-point";
import { distanceBetween, distanceFrom, nearestFirst, radiusFromNeighbors, withinRadius, type Point } from "@/lib/nearby-from-layer";
import { useFollowStore } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import type { LayerUsersSnapshot, NearbyPerson } from "@/types";

export function useNearbyList(fromServer: NearbyPerson[] | undefined, enabled: boolean): NearbyPerson[] {
  const layer = useMapStore((s) => s.layer);
  const myMusicId = useMapStore((s) => s.myMusicId);

  const leaderMusicId = useFollowStore((s) => s.leaderMusicId);
  const anchorMusicId = leaderMusicId ?? myMusicId;

  const { data: layerUsers } = useLayerUsersQuery(layer, enabled);

  return useMemo(() => {
    if (!enabled) return [];

    const merged = [...(fromServer ?? [])];
    const seen = new Set(merged.map((p) => p.email));

    for (const p of fromLayer(layerUsers, seen)) merged.push(p);

    const me = layerPointOf(anchorMusicId, layer);
    const placed = merged.map((p) => ({ ...p, distance: distanceFrom(me, pointOfPerson(p, layer)) }));
    return nearestFirst(withinRadius(placed, nearRadius(layer, me)), LAYER_USERS.maxInPanel);
  }, [enabled, fromServer, layer, anchorMusicId, layerUsers]);
}

function nearRadius(layer: number, me: Point | null): number | null {
  const engine = getMapEngine();
  if (!engine || !me) return null;
  const dx = layer * 2;
  const dy = dx + 1;
  return radiusFromNeighbors(
    engine.songs.map((s) => distanceBetween({ x: s.pc[dx], y: s.pc[dy] }, me)),
    LAYER_USERS.neighborK,
  );
}

function pointOfPerson(p: NearbyPerson, layer: number): Point | null {
  if (p.x != null && p.y != null) return { x: p.x, y: p.y };
  return layerPointOf(p.musicId, layer);
}

function fromLayer(snapshot: LayerUsersSnapshot | undefined, seen: ReadonlySet<string>): NearbyPerson[] {
  if (!snapshot) return [];

  const out: NearbyPerson[] = [];
  for (const g of snapshot.groups) {
    for (const u of g.users) {
      if (seen.has(u.email)) continue;
      out.push({
        email: u.email,
        nickname: u.nickname,
        imageUrl: u.imageUrl,

        meetingCount: 0,
        riderCount: u.riderCount,
        musicId: g.musicId,
        x: g.x,
        y: g.y,

        distance: Number.POSITIVE_INFINITY,
      });
    }
  }
  return out;
}

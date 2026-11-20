"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NO_GENRE_ID, REALTIME } from "@/constants";
import { getMapEngine } from "@/components/map/engine/engine-registry";
import { useLayerUsersQuery } from "@/hooks/queries/use-layer-users-query";
import { seedOf } from "@/lib/avatar-seed";
import { expect, onConnectionChange, onType, send, settle } from "@/lib/realtime/stomp-client";
import { isRiding } from "@/stores/use-follow-store";
import { useMapStore } from "@/stores/use-map-store";
import type {
  CrowdCell,
  LayerBox,
  LayerUsersSnapshot,
  NearbyUser,
  ViewportBulkEnter,
  ViewportMusicGroup,
  ViewportDelta,
  ViewportRiderCount,
  ViewportSnapshot,
} from "@/types";

let viewportSeq = 0;
const VIEWPORT_KEY = "presence/viewport";

const EMPTY_CROWD: CrowdCell[] = [];

const EMPTY_OVERLAY: Map<string, NearbyUser | null> = new Map();
const EMPTY_RIDER_COUNTS: Map<string, number> = new Map();

export function toViewportRequest(seq: number, boxes: readonly LayerBox[], view: LayerBox) {
  return {
    requestSeq: seq,
    layer: boxes.length,
    minX: view.xMin,
    maxX: view.xMax,
    minY: view.yMin,
    maxY: view.yMax,
    ancestorBounds: boxes.map((b) => ({ layer: b.layer, minX: b.xMin, maxX: b.xMax, minY: b.yMin, maxY: b.yMax })),
  };
}

export { seedOf };

function toNearbyUser(p: {
  email: string;
  nickname: string | null;
  imageUrl: string | null;
  riderCount: number | null;
  musicId: number;
  x: number;
  y: number;
}): NearbyUser {
  return {
    email: p.email,
    nickname: p.nickname,
    imageUrl: p.imageUrl,
    isOnline: true,
    musicId: p.musicId,
    viewingMusicId: p.musicId,
    genreId: getMapEngine()?.genreOf(p.musicId) ?? NO_GENRE_ID,
    meetingCount: 0,
    riderCount: p.riderCount ?? 0,
    followingNickname: null,
    avatarSeed: seedOf(p.email),
    x: p.x,
    y: p.y,
  };
}

export function mergePeople(
  groups: ViewportMusicGroup[] | undefined,
  overlay: Map<string, NearbyUser | null>,
  riderCounts: Map<string, number>,
): Map<string, NearbyUser> {
  const next = new Map<string, NearbyUser>();
  for (const g of groups ?? []) {
    for (const u of g.users) next.set(u.email, toNearbyUser({ ...u, musicId: g.musicId, x: g.x, y: g.y }));
  }
  for (const [email, u] of overlay) {
    if (u) next.set(email, u);
    else next.delete(email);
  }
  for (const [email, riderCount] of riderCounts) {
    const had = next.get(email);
    if (had && had.riderCount !== riderCount) next.set(email, { ...had, riderCount });
  }
  return next;
}

let riderCountAdjust: ((email: string, delta: number) => void) | null = null;
export function adjustRiderCount(email: string, delta: number): void {
  riderCountAdjust?.(email, delta);
}

export function pushViewport(): void {
  const e = getMapEngine();
  if (!e) return;

  if (isRiding()) return;
  viewportSeq += 1;
  const ok = send(REALTIME.send.viewport, toViewportRequest(viewportSeq, useMapStore.getState().boxes, e.viewBox()));

  if (ok) expect(VIEWPORT_KEY, pushViewport);
}

export function useViewportSubscription(enabled: boolean): void {
  const layer = useMapStore((s) => s.layer);
  const boxes = useMapStore((s) => s.boxes);
  const morph = useMapStore((s) => s.morph);

  const [overlay, setOverlay] = useState<Map<string, NearbyUser | null>>(() => new Map());

  const [riderCounts, setRiderCounts] = useState<Map<string, number>>(() => new Map());

  const mode = useRef<ViewportSnapshot["mode"] | null>(null);

  const ridingSeq = useRef(0);

  const peopleRef = useRef<Map<string, NearbyUser>>(new Map());
  useEffect(() => {
    riderCountAdjust = (email, delta) => {
      const base = peopleRef.current.get(email)?.riderCount ?? 0;
      setRiderCounts((prev) => new Map(prev).set(email, Math.max(0, base + delta)));
    };
    return () => {
      riderCountAdjust = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || morph) return;
    const id = window.setTimeout(pushViewport, REALTIME.viewportDebounceMs);
    return () => window.clearTimeout(id);
  }, [enabled, morph, layer, boxes]);

  useEffect(() => (enabled ? onConnectionChange((up) => up && pushViewport()) : undefined), [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const fresh = (requestSeq: number, ride: boolean) => {
      if (!ride) return requestSeq === viewportSeq;
      if (requestSeq < ridingSeq.current) return false;
      ridingSeq.current = requestSeq;
      return true;
    };

    const applySnapshot = (p: ViewportSnapshot) => {
      mode.current = p.mode;
      if (p.mode !== "INDIVIDUAL") return;
      setOverlay((prev) => {
        const next = new Map(prev);
        for (const g of p.groups) for (const u of g.users) next.set(u.email, toNearbyUser({ ...u, musicId: g.musicId, x: g.x, y: g.y }));
        return next;
      });
    };

    const stopSnap = onType<ViewportSnapshot>(["VIEWPORT_SNAPSHOT", "RIDE_VIEWPORT"], (p, msg) => {
      const ride = msg.type === "RIDE_VIEWPORT";
      if (!ride) settle(VIEWPORT_KEY);

      if (!fresh(p.requestSeq, ride)) return;
      applySnapshot(p);
    });

    const stopDelta = onType<ViewportDelta>(
      ["VIEWPORT_ENTER", "VIEWPORT_MOVE", "VIEWPORT_LEAVE", "RIDE_VIEWPORT_ENTER", "RIDE_VIEWPORT_MOVE", "RIDE_VIEWPORT_LEAVE"],
      (p, msg) => {
        const ride = msg.type.startsWith("RIDE_");
        if (!fresh(p.requestSeq, ride) || mode.current !== "INDIVIDUAL") return;
        setOverlay((prev) => {
          const next = new Map(prev);
          if (msg.type === "VIEWPORT_LEAVE" || msg.type === "RIDE_VIEWPORT_LEAVE") {
            next.set(p.email, null);
            return next;
          }

          if (p.musicId == null || p.x == null || p.y == null) return prev;
          next.set(p.email, toNearbyUser({ ...p, musicId: p.musicId, x: p.x, y: p.y }));
          return next;
        });
      },
    );

    const stopBulk = onType<ViewportBulkEnter>(["VIEWPORT_BULK_ENTER", "RIDE_VIEWPORT_BULK_ENTER"], (p, msg) => {
      if (!fresh(p.requestSeq, msg.type.startsWith("RIDE_")) || mode.current !== "INDIVIDUAL") return;
      setOverlay((prev) => {
        const next = new Map(prev);
        for (const u of p.users) next.set(u.email, toNearbyUser({ ...u, musicId: p.musicId, x: p.x, y: p.y }));
        return next;
      });
    });

    const stopRiders = onType<ViewportRiderCount>(["VIEWPORT_RIDER_COUNT", "RIDE_VIEWPORT_RIDER_COUNT"], (p, msg) => {
      if (!fresh(p.requestSeq, msg.type.startsWith("RIDE_"))) return;

      setRiderCounts((prev) => (prev.get(p.email) === p.riderCount ? prev : new Map(prev).set(p.email, p.riderCount)));
    });

    return () => {
      stopSnap();
      stopDelta();
      stopBulk();
      stopRiders();
    };
  }, [enabled]);

  const { data: layerUsers } = useLayerUsersQuery(layer, enabled);

  const [basedOn, setBasedOn] = useState<LayerUsersSnapshot | null>(null);
  if (layerUsers && layerUsers !== basedOn) {
    setBasedOn(layerUsers);
    setOverlay(EMPTY_OVERLAY);
    setRiderCounts(EMPTY_RIDER_COUNTS);
  }

  const people = useMemo(() => mergePeople(layerUsers?.groups, overlay, riderCounts), [layerUsers, overlay, riderCounts]);
  useEffect(() => {
    peopleRef.current = people;
  }, [people]);

  useEffect(() => {
    getMapEngine()?.setFriends(layer, [...people.values()]);
  }, [layer, people]);

  useEffect(() => {
    getMapEngine()?.setCrowd(layer, EMPTY_CROWD);
  }, [layer]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      if (isRiding()) return;
      send(REALTIME.send.viewportClose, { requestSeq: viewportSeq });
    };
  }, [enabled]);
}

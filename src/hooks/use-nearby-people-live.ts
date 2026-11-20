"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, REALTIME } from "@/constants";
import { onConnectionChange, onType, send } from "@/lib/realtime/stomp-client";
import { isRiding } from "@/stores/use-follow-store";
import type { NearbyBulkEnter, NearbyChange, NearbyPerson, NearbyRiderCount, NearbySnapshot } from "@/types";

export function useNearbyPeopleLive(open: boolean, refetch: () => void): void {
  const qc = useQueryClient();

  const snapshotSeq = useRef(0);

  useEffect(() => {
    if (!open) return;

    const put = (fn: (people: NearbyPerson[]) => NearbyPerson[]) =>
      qc.setQueryData<NearbySnapshot>(QUERY_KEYS.realtime.nearby, (prev) => (prev ? { ...prev, people: fn(prev.people) } : prev));

    const stopSnap = onType<NearbySnapshot>(["NEARBY_SNAPSHOT"], (p) => {
      snapshotSeq.current = p.snapshotSeq;
      qc.setQueryData<NearbySnapshot>(QUERY_KEYS.realtime.nearby, p);
    });

    const stopDelta = onType<NearbyChange>(["NEARBY_ENTER", "NEARBY_MOVE", "NEARBY_LEAVE"], (p, msg) => {
      if (msg.seq > 0 && msg.seq <= snapshotSeq.current) return;
      if (msg.type === "NEARBY_LEAVE") {
        put((people) => people.filter((x) => x.email !== p.email));
        return;
      }
      if (p.musicId == null) return;
      put((people) => {
        const at = people.findIndex((x) => x.email === p.email);
        if (at >= 0) {
          const next = [...people];
          next[at] = { ...next[at], musicId: p.musicId!, nickname: p.nickname, imageUrl: p.imageUrl, meetingCount: p.meetingCount ?? next[at].meetingCount, x: p.x, y: p.y };
          return next;
        }

        const fresh: NearbyPerson = {
          email: p.email,
          nickname: p.nickname,
          imageUrl: p.imageUrl,
          meetingCount: p.meetingCount ?? 0,
          riderCount: p.riderCount ?? 0,
          musicId: p.musicId!,
          x: p.x,
          y: p.y,
          distance: Number.POSITIVE_INFINITY,
        };
        return [...people, fresh];
      });
    });

    const stopBulk = onType<NearbyBulkEnter>(["NEARBY_BULK_ENTER"], (p) => {
      put((people) => {
        const next = people.filter((x) => !p.people.some((n) => n.email === x.email));

        const near = next.find((x) => x.musicId === p.musicId) ?? null;
        const fresh = p.people.map((n) => ({
          email: n.email,
          nickname: n.nickname,
          imageUrl: n.imageUrl,
          meetingCount: n.meetingCount ?? 0,
          riderCount: n.riderCount ?? 0,
          musicId: p.musicId,
          x: near?.x ?? null,
          y: near?.y ?? null,
          distance: Number.POSITIVE_INFINITY,
        }));
        return [...next, ...fresh];
      });
    });

    const stopRiders = onType<NearbyRiderCount>(["NEARBY_RIDER_COUNT"], (p) => {
      put((people) => {
        const at = people.findIndex((x) => x.email === p.email);
        if (at < 0 || people[at].riderCount === p.riderCount) return people;
        const next = [...people];
        next[at] = { ...next[at], riderCount: p.riderCount };
        return next;
      });
    });

    return () => {
      stopSnap();
      stopDelta();
      stopBulk();
      stopRiders();
    };
  }, [open, qc]);

  useEffect(() => {
    if (!open) return;
    return onConnectionChange((up) => {
      if (!up) return;
      snapshotSeq.current = 0;
      refetch();
    });
  }, [open, refetch]);

  useEffect(() => {
    if (!open) return;
    return () => {
      if (isRiding()) return;
      send(REALTIME.send.nearbyClose);
    };
  }, [open]);
}

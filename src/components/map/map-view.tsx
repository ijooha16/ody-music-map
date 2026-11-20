"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Occlusion } from "@/components/map/engine/map-engine";
import { CONSTELLATION, COVER_COUNT, HOLD, HOVER_CARD, NO_GENRE_ID, PINCH, PROBE, REPRESENTATIVE_COUNT, RIDE_LOCK_TOAST_MS, RIDING_LOCKED, RIDING_MAP_LOCKED, STORAGE_KEYS, WHEEL_ZOOM } from "@/constants";
import { BREAKPOINTS } from "@/constants/design-tokens";
import type { LayerBox, MapPoint } from "@/types";
import { useConstellationLayoutQuery } from "@/hooks/queries/use-constellation-layout-query";
import { useMapSongsQuery } from "@/hooks/queries/use-map-songs-query";
import { useMeQuery } from "@/hooks/queries/use-me-query";
import { useNearbyQuery } from "@/hooks/queries/use-nearby-query";
import { useDeclarePlay } from "@/hooks/use-declare-play";
import { useDemoPins } from "@/hooks/use-demo-pins";
import { seedOf, useViewportSubscription } from "@/hooks/use-viewport-subscription";
import { useFeatures } from "@/hooks/use-features";
import { useIsNarrow } from "@/hooks/use-is-narrow";
import { usePlaySong } from "@/hooks/use-play-song";
import { ensureSongPoint } from "@/lib/realtime/ride-point";
import { readStorage, writeStorage } from "@/lib/storage";
import { isRiding, useFollowStore } from "@/stores/use-follow-store";
import { useUnplayableStore } from "@/stores/use-unplayable-store";
import { useJourneyStore } from "@/stores/use-journey-store";
import { rememberMusicHints } from "@/lib/music-hints";
import { overlayTapSnap } from "@/lib/overlay-tap-snap";
import { useMapStore } from "@/stores/use-map-store";
import { useToastStore } from "@/stores/use-toast-store";
import { usePanelStore } from "@/stores/use-panel-store";
import { usePlayerStore } from "@/stores/use-player-store";
import { useTutorialStore } from "@/stores/use-tutorial-store";
import { registerMapEngine } from "./engine/engine-registry";
import { rideLayerTarget } from "./engine/ride-layer";
import { MapEngine } from "./engine/map-engine";
import FloatingReactions from "./floating-reactions";
import HoverCard from "./hover-card";
import LayerTitleCard from "./layer-title-card";
import LayerToast from "./layer-toast";
import MapCanvas from "./map-canvas";
import { shouldFollowPlayback } from "./selection-follow";
import StarfieldPlaceholder from "./starfield-placeholder";
import { useViewport } from "./use-viewport";
import { ANALYTICS } from "@/constants/analytics";
import { analyticsContext, track, trackOnce } from "@/lib/analytics/client";
import { nearbyResults } from "@/lib/analytics/flows";
import { albumCover } from "./render/cover-art";
import { byCoverPriority } from "./render/cover-spread";
import { COVER_PX } from "./render/sprites";

interface MapViewProps {
  occlusion: Occlusion;
}

export default function MapView({ occlusion }: MapViewProps) {
  const engine = useMemo(() => new MapEngine(), []);
  const narrow = useIsNarrow();
  const features = useFeatures();
  const { ref, size } = useViewport();
  const [hover, setHover] = useState(false);

  const [hoverSong, setHoverSong] = useState<MapPoint | null>(null);

  const [cardOn, setCardOn] = useState(false);

  const heldSong = useRef<MapPoint | null>(null);

  const hideTimer = useRef<number | null>(null);
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelStart = useRef<{ layer: number; zoom: number; mode: string } | null>(null);
  useEffect(() => () => { if (wheelTimer.current) clearTimeout(wheelTimer.current); }, []);

  const boxes = useMapStore((s) => s.boxes);
  const { data: rawSongs, isError: songsFailed } = useMapSongsQuery(boxes);

  useDemoPins(engine);

  const prefetchBoxes = useMapStore((s) => s.prefetchBoxes);
  const { data: rawPrefetchedSongs } = useMapSongsQuery(prefetchBoxes ?? boxes);

  const songs = useMemo(() => rawSongs?.filter((song) => song.playable !== false), [rawSongs]);
  const prefetchedSongs = useMemo(() => rawPrefetchedSongs?.filter((song) => song.playable !== false), [rawPrefetchedSongs]);

  const unplayableIds = useUnplayableStore((s) => s.ids);
  useEffect(() => {
    for (const musicId of unplayableIds) engine.hideSong(musicId);
  }, [engine, unplayableIds, songs]);

  useEffect(() => {
    if (prefetchBoxes && prefetchedSongs) engine.setPrefetched(prefetchBoxes, prefetchedSongs);
  }, [engine, prefetchBoxes, prefetchedSongs]);
  const layer = useMapStore((s) => s.layer);

  useViewportSubscription(features.social);

  useDeclarePlay();
  const viewMode = useMapStore((s) => s.viewMode);
  const nearbyCenterMusicId = useMapStore((s) => s.nearbyCenterMusicId);
  const constellationMusicIds = useMapStore((s) => s.constellationMusicIds);
  const constellationPoints = useMapStore((s) => s.constellationPoints);
  const { data: layout } = useConstellationLayoutQuery(constellationMusicIds);
  const selectedMusicId = useMapStore((s) => s.selectedMusicId);
  const myMusicId = useMapStore((s) => s.myMusicId);
  const home = useMapStore((s) => s.home);
  const selectMusic = useMapStore((s) => s.selectMusic);
  const syncFromEngine = useMapStore((s) => s.syncFromEngine);

  const openSongFromMap = usePanelStore((s) => s.openSongFromMap);
  const openFeed = usePanelStore((s) => s.openFeed);
  const currentMusicId = usePlayerStore((s) => s.currentMusicId);
  const playWithConfirm = usePlaySong();
  const leaderEmail = useFollowStore((s) => s.leaderEmail);
  const leaderNickname = useFollowStore((s) => s.leaderNickname);
  const leaderImageUrl = useFollowStore((s) => s.leaderImageUrl);
  const leaderMusicId = useFollowStore((s) => s.leaderMusicId);
  const leaderViewingMusicId = useFollowStore((s) => s.leaderViewingMusicId);
  const leaderLayer = useFollowStore((s) => s.leaderLayer);

  const leaderPointRevision = useFollowStore((s) => s.pointRevision);

  const followerCount = useFollowStore((s) => s.followerCount);
  const riders = useFollowStore((s) => s.riders);
  useEffect(() => {
    engine.setMyRiders(
      followerCount,
      riders.map((r) => ({
        email: r.email,
        nickname: r.nickname,
        imageUrl: r.imageUrl,
        isOnline: true,
        musicId: 0,
        viewingMusicId: 0,
        genreId: NO_GENRE_ID,
        meetingCount: 0,
        riderCount: 0,
        followingNickname: null,
        avatarSeed: seedOf(r.email),
      })),
    );
  }, [engine, followerCount, riders]);

  const { data: me } = useMeQuery();
  useEffect(() => {
    engine.setMyProfile(me ? { nickname: me.nickname, imageUrl: me.imageUrl } : null);
  }, [engine, me]);
  const pickTarget = useJourneyStore((s) => s.pickTarget);
  const { data: nearby } = useNearbyQuery(viewMode === "nearby" ? nearbyCenterMusicId : null);

  useEffect(() => {
    if (nearbyCenterMusicId == null) return;

    if (window.innerWidth < BREAKPOINTS.tablet) return;

    if (useMapStore.getState().nearbyPanelHandled) return;
    const p = usePanelStore.getState();

    if (p.activePanel === "song" && p.musicId === nearbyCenterMusicId) return;
    p.openSong(nearbyCenterMusicId);
  }, [nearbyCenterMusicId]);

  const lastLayer = useRef(layer);
  useEffect(() => {
    if (lastLayer.current === layer) return;
    lastLayer.current = layer;
    usePanelStore.getState().collapse();
  }, [layer]);

  useEffect(() => {
    registerMapEngine(engine);
    engine.setSnapshotListener(syncFromEngine);

    if (process.env.NODE_ENV !== "production") (window as unknown as { __odyEngine?: MapEngine }).__odyEngine = engine;
    engine.setCallbacks({
      onFollowEnd: () => useFollowStore.getState().stop(),
      onArrive: (id) => usePlayerStore.getState().playSingle(id),

      onLeaderViewingChange: (id) => {
        useMapStore.getState().selectMusic(id);
        usePanelStore.getState().openSong(id);
      },
    });
    return () => registerMapEngine(null);
  }, [engine, syncFromEngine]);

  useEffect(() => engine.setOcclusion(occlusion), [engine, occlusion]);

  useEffect(() => {
    const measure = () => {
      const host = document.querySelector("canvas")?.getBoundingClientRect();
      if (!host) return;

      engine.setInstrumentInset(window.innerWidth < BREAKPOINTS.tablet ? 0 : CONSTELLATION.instrumentInsetPx);
      engine.setObstacles(
        [...document.querySelectorAll("[data-hud]")].map((el) => {
          const r = el.getBoundingClientRect();
          return { x0: r.left - host.left, y0: r.top - host.top, x1: r.right - host.left, y1: r.bottom - host.top };
        }),
      );
    };
    measure();
    const later = setTimeout(measure, 420);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(later);
      window.removeEventListener("resize", measure);
    };
  }, [engine, occlusion, viewMode]);

  useEffect(() => {
    if (!songs) return;
    if (!engine.ready) {
      engine.setInitialMy(readStorage<number>(STORAGE_KEYS.myMusicId));

      engine.restoreHome(readStorage<{ musicId: number; boxes: LayerBox[] }>(STORAGE_KEYS.myHome));
    }
    engine.setLayerSongs(boxes.length, songs);
    trackOnce("map-ready", "map_ready", { result_count: songs.length, layer: boxes.length });
  }, [engine, boxes, songs]);

  const repPoints = useMemo(
    () => (songs ? [...songs].sort(byCoverPriority((p) => p.albumMbid != null, (p) => p.weight)).slice(0, REPRESENTATIVE_COUNT) : null),
    [songs],
  );
  const representatives = useMemo(() => repPoints?.map((p) => p.musicId) ?? null, [repPoints]);

  useEffect(() => {
    if (!repPoints) return;
    for (const p of repPoints.slice(0, COVER_COUNT.near)) albumCover(p.musicId, p.albumMbid, COVER_PX);
  }, [repPoints]);
  useEffect(() => {
    if (representatives) engine.setRepresentatives(boxes.length, representatives);
  }, [engine, boxes.length, representatives]);

  useEffect(() => {
    if (viewMode === "nearby" && nearby) {
      engine.enterProbe(nearby.center, nearby.neighbors);
      nearbyResults(nearby.center.musicId, nearby.neighbors.length);
    }
    else if (viewMode !== "nearby") engine.exitProbe();
  }, [engine, viewMode, nearby]);

  useEffect(() => {
    if (viewMode === "constellation" && layout) {
      engine.adopt(constellationPoints);
      engine.enterConstellation(constellationMusicIds, layout.points);
    } else if (viewMode !== "constellation") engine.exitConstellation();
  }, [engine, viewMode, constellationMusicIds, constellationPoints, layout]);
  useEffect(() => engine.setSelected(selectedMusicId), [engine, selectedMusicId]);

  const restoredPlaying = useRef<number | null>(null);
  const restoreLastPlayed = usePlayerStore((s) => s.restoreLast);
  useEffect(() => {
    const saved = readStorage<number>(STORAGE_KEYS.playingMusicId);
    if (saved == null) return;
    restoredPlaying.current = saved;
    restoreLastPlayed(saved);
  }, [restoreLastPlayed]);

  useEffect(() => {
    if (currentMusicId == null) return;

    const restored = currentMusicId === restoredPlaying.current;
    if (restored) restoredPlaying.current = null;
    else engine.travelTo(currentMusicId);

    const follow = shouldFollowPlayback({
      playingMusicId: currentMusicId,
      selectedMusicId: useMapStore.getState().selectedMusicId,
      restored,
      riding: isRiding(),
    });
    if (follow) selectMusic(currentMusicId);
  }, [engine, currentMusicId, selectMusic]);

  const residentCount = useMapStore((s) => s.residentCount);
  const qc = useQueryClient();
  useEffect(() => {
    if (!leaderEmail || leaderMusicId == null) {
      engine.stopFollow();
      return;
    }

    if (!engine.ready) return;
    if (!engine.pointOf(leaderMusicId)) {
      void ensureSongPoint(qc, leaderMusicId).then((ok) => ok && useFollowStore.getState().markPointAdopted());
      return;
    }

    if (engine.anim) return;

    const toLayer = rideLayerTarget(layer, leaderLayer);
    if (toLayer != null && engine.rideToLayer(toLayer, leaderMusicId)) return;
    engine.startFollow(
      {
        email: leaderEmail,
        nickname: leaderNickname,
        imageUrl: leaderImageUrl,

        isOnline: true,
        musicId: leaderMusicId,

        viewingMusicId: leaderViewingMusicId ?? leaderMusicId,
        genreId: engine.genreOf(leaderMusicId) ?? NO_GENRE_ID,
        meetingCount: 0,

        riderCount: 0,
        followingNickname: null,
        avatarSeed: seedOf(leaderEmail),
      },
      true,
    );
  }, [engine, qc, leaderEmail, leaderNickname, leaderImageUrl, leaderMusicId, leaderViewingMusicId, leaderLayer, leaderPointRevision, layer, residentCount]);

  useEffect(() => {
    if (myMusicId != null) writeStorage(STORAGE_KEYS.myMusicId, myMusicId);
  }, [myMusicId]);
  useEffect(() => {
    if (home) writeStorage(STORAGE_KEYS.myHome, home);
  }, [home]);

  const cancelHide = useCallback(() => {
    if (hideTimer.current == null) return;
    clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);
  const scheduleHide = useCallback(() => {
    if (hideTimer.current != null) return;
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      setCardOn(false);
    }, HOVER_CARD.graceMs);
  }, []);

  useEffect(() => {
    if (cardOn || hoverSong == null) return;
    const t = setTimeout(() => {
      engine.setHover(null);
      heldSong.current = null;
      setHoverSong(null);
    }, HOVER_CARD.fadeMs);
    return () => clearTimeout(t);
  }, [engine, cardOn, hoverSong]);
  useEffect(() => cancelHide, [cancelHide]);

  const lockToastAt = useRef(0);
  const notifyMapLocked = useCallback(() => {
    const now = Date.now();
    if (now - lockToastAt.current < RIDE_LOCK_TOAST_MS) return;
    lockToastAt.current = now;
    useToastStore.getState().show(RIDING_MAP_LOCKED);
  }, []);

  const zoomBy = useCallback(
    (deltaY: number, mx: number, my: number) => {
      if (isRiding()) {
        notifyMapLocked();
        return;
      }
      const mode = useMapStore.getState().viewMode;
      const mapSnapshot = useMapStore.getState();
      wheelStart.current ??= { layer: mapSnapshot.layer, zoom: mapSnapshot.zoomK, mode };
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      const eventContext = analyticsContext();
      wheelTimer.current = setTimeout(() => {
        const start = wheelStart.current;
        wheelStart.current = null;
        if (!start) return;
        const end = useMapStore.getState();
        track("map_zoom_completed", { ...eventContext, view_mode: start.mode, from_layer: start.layer, layer: end.layer, from_zoom: start.zoom, zoom: end.zoomK });
      }, ANALYTICS.wheelSettleMs);

      if (mode === "constellation") {
        engine.overlayWheel(deltaY);
        return;
      }

      if (mode === "nearby") {
        if (engine.probeZoom(Math.exp(-deltaY * WHEEL_ZOOM)) <= PROBE.minZoom) useMapStore.getState().exitNearby();
        return;
      }

      return engine.wheel(deltaY, mx, my);
    },
    [engine, notifyMapLocked],
  );

  const onWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();

      engine.collapseStack();
      zoomBy(e.deltaY, e.clientX - r.left, e.clientY - r.top);
    },
    [zoomBy, engine],
  );

  const holdTimer = useRef<number | null>(null);
  const holdFired = useRef(false);
  const cancelHold = useCallback(() => {
    if (holdTimer.current != null) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    engine.cancelHold();
  }, [engine]);
  useEffect(() => cancelHold, [cancelHold]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const pinchDist = useRef<number | null>(null);

  const pinchPressing = useRef(false);

  const pinchNow = useCallback(() => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return null;
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* 이미 풀린 포인터 — 잡기만 포기하고 계속 간다 */
      }
      if (pointers.current.size >= 2) {
        cancelHold();
        drag.current = null;
        pinchDist.current = pinchNow()?.dist ?? null;
        pinchPressing.current = false;
        return;
      }
      drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
      holdFired.current = false;
      if (engine.follow) return;
      const map = useMapStore.getState();

      if (map.viewMode === "constellation" || useJourneyStore.getState().pickTarget) return;
      const r = e.currentTarget.getBoundingClientRect();
      const hit = engine.hitTest(e.clientX - r.left, e.clientY - r.top);
      if (!hit) return;
      const id = engine.songs[hit.i].musicId;

      if (map.viewMode === "nearby" && id === map.nearbyCenterMusicId) return;
      engine.startHold(id);
      holdTimer.current = window.setTimeout(() => {
        holdTimer.current = null;
        engine.cancelHold();
        holdFired.current = true;
        drag.current = null;
        useMapStore.getState().enterNearby(id);
        useTutorialStore.getState().complete("nearby");
      }, HOLD.ms);
    },
    [engine, cancelHold, pinchNow],
  );
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size >= 2) {
        const p = pinchNow();
        if (!p || pinchDist.current == null) return;
        if (Math.abs(p.dist - pinchDist.current) < PINCH.minDeltaPx) return;

        const k = Math.min(PINCH.maxStep, Math.max(1 / PINCH.maxStep, p.dist / pinchDist.current));
        pinchDist.current = p.dist;
        const boost = pinchPressing.current ? PINCH.pressureBoost : 1;
        const verdict = zoomBy((-Math.log(k) / WHEEL_ZOOM) * boost, p.mx - r.left, p.my - r.top);
        pinchPressing.current = verdict === "pressure";
        return;
      }
      if (drag.current) {
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        drag.current.moved += Math.abs(dx) + Math.abs(dy);

        if (drag.current.moved > 5) engine.collapseStack();
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;

        if (drag.current.moved > HOLD.moveTol) {
          cancelHold();

          const overlay = useMapStore.getState().viewMode;
          if (overlay !== "constellation" && overlay !== "nearby") usePanelStore.getState().collapse();
        }
        const mode = useMapStore.getState().viewMode;

        if (isRiding()) notifyMapLocked();
        else if (mode === "constellation") engine.overlayPan(dx, dy);

        else if (mode === "nearby") engine.probePan(dx, dy);
        else engine.dragBy(dx, dy);
        return;
      }

      if (e.pointerType !== "mouse") return;

      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const hitF = engine.hitFriend(mx, my);
      const hit = hitF ? null : engine.hitTest(mx, my);
      const song = hit ? engine.songs[hit.i] : null;

      const inNearby = useMapStore.getState().viewMode === "nearby";
      if (song && !inNearby) {
        cancelHide();
        engine.setHover(song.musicId);
        heldSong.current = song;
        setHoverSong(song);
        setCardOn(true);
      } else {
        if (inNearby) engine.setHover(song?.musicId ?? null);
        scheduleHide();
      }
      setHover(!!hit || !!hitF || !!engine.hitHopLink(mx, my));
    },
    [engine, cancelHide, scheduleHide, cancelHold, pinchNow, zoomBy, notifyMapLocked],
  );

  const playSong = useCallback(
    (s: MapPoint) => {
      rememberMusicHints([{ id: s.musicId, title: s.title, artist: s.artist }]);
      selectMusic(s.musicId);

      if (!narrow) openSongFromMap(s.musicId);

      playWithConfirm(s.musicId);
      useTutorialStore.getState().complete("select");
    },
    [narrow, openSongFromMap, playWithConfirm, selectMusic],
  );

  const pressSong = useCallback(
    (s: MapPoint) => {
      if (isRiding()) {
        useToastStore.getState().show(RIDING_LOCKED);
        return;
      }
      const map = useMapStore.getState();
      track("music_clicked", { music_id: s.musicId, source: "canvas", action: map.selectedMusicId === s.musicId ? "play" : "inspect" });
      if (map.selectedMusicId === s.musicId) {
        playSong(s);
        return;
      }

      selectMusic(s.musicId);

      const panel = usePanelStore.getState();
      openSongFromMap(s.musicId, overlayTapSnap({ narrow, viewMode: map.viewMode, activePanel: panel.activePanel, snap: panel.snap }));

      if (map.viewMode === "constellation") engine.overlayFocus(s.musicId);
      else if (map.viewMode !== "nearby") engine.viewSong(s.musicId);
      useTutorialStore.getState().complete("select");
    },
    [engine, narrow, openSongFromMap, playSong, selectMusic],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const wasPinching = pinchDist.current != null;
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinchDist.current = null;

      if (wasPinching) {
        cancelHold();
        const [rest] = [...pointers.current.values()];
        drag.current = rest ? { x: rest.x, y: rest.y, moved: 0 } : null;
        return;
      }
      cancelHold();
      const d = drag.current;
      drag.current = null;

      if (holdFired.current) {
        holdFired.current = false;
        return;
      }
      if (!d) return;
      if (d.moved > 5) { track("map_pan_completed", { distance_px: Math.round(d.moved) }); return; }
      const r = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;

      const link = engine.hitHopLink(mx, my);
      if (link) {
        useMapStore.getState().enterNearby(link.id);
        return;
      }
      const fr = engine.hitFriend(mx, my);
      if (fr) {
        if (!fr.spread && (fr.stacked.length > 0 || engine.songUnder(fr))) {
          engine.expandStack(fr.user.email);
          return;
        }
        engine.collapseStack();
        openFeed(fr.user.email);
        return;
      }

      engine.collapseStack();
      if (engine.follow) return;

      const gid = engine.hitGhost(mx, my);
      if (gid != null) {
        track("music_clicked", { music_id: gid, source: "ghost", action: "inspect" });
        selectMusic(gid);
        openSongFromMap(gid);
        return;
      }
      const hit = engine.hitTest(mx, my);

      const song = hit ? engine.songs[hit.i] : e.pointerType === "mouse" ? heldSong.current : null;
      if (!song) {
        if (heldSong.current) setCardOn(false);

        if (!narrow) {
          const map = useMapStore.getState();
          if (map.viewMode === "nearby") map.exitNearby();
        }
        return;
      }
      const id = song.musicId;

      const overlayIds = engine.clickableOverlayIds();
      if (overlayIds && !overlayIds.has(id)) return;

      const journey = useJourneyStore.getState();
      if (journey.pickTarget) {
        track("music_clicked", { music_id: id, source: "canvas", action: `set_${journey.pickTarget}` });

        rememberMusicHints([{ id, title: song.title, artist: song.artist }]);
        journey.pickForNext(id);
        selectMusic(id);
        return;
      }
      pressSong(song);
    },
    [engine, cancelHold, narrow, openFeed, openSongFromMap, pressSong, selectMusic],
  );

  const onPointerLeave = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if (drag.current && drag.current.moved > 5) track("map_pan_completed", { distance_px: Math.round(drag.current.moved), reason: "leave" });
    drag.current = null;
    cancelHold();
    scheduleHide();
    setHover(false);
  }, [scheduleHide, cancelHold]);

  const onPointerCancel = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinchDist.current = null;
      drag.current = null;
      cancelHold();
    },
    [cancelHold],
  );

  const following = leaderEmail != null;

  const cursor = following ? "cursor-not-allowed" : pickTarget ? "cursor-crosshair" : hover || hoverSong != null ? "cursor-pointer" : "cursor-grab active:cursor-grabbing";

  return (
    <div
      data-analytics-manual
      data-map
      ref={ref}

      className={`stage-bg absolute inset-0 touch-none select-none overflow-hidden ${cursor}`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
    >
      <MapCanvas engine={engine} width={size.width} height={size.height} />
      <div className="vignette pointer-events-none absolute inset-0" />
      <div className="grain pointer-events-none absolute inset-0" />
      <LayerToast />

      {features.social && <FloatingReactions />}
      <LayerTitleCard />

      <HoverCard engine={engine} song={hoverSong} on={cardOn} />
      {!songs && <StarfieldPlaceholder width={size.width} height={size.height} failed={songsFailed} />}
    </div>
  );
}

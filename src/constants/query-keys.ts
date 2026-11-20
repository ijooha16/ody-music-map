import type { LayerBox, SearchCondition } from "@/types";

export const QUERY_KEYS = {
  health: ["health"] as const,

  auth: {
    me: ["auth", "me"] as const,

    nicknameAvailable: (nickname: string) => ["auth", "nickname-available", nickname] as const,
  },

  constellation: {
    layout: (musicIds: number[]) => ["constellation", "layout", musicIds.join(",")] as const,
  },

  map: {
    songs: (boxes: readonly LayerBox[]) =>
      ["map", "songs", boxes.map((b) => `${b.layer}:${[b.xMin, b.yMin, b.xMax, b.yMax].map((v) => v.toFixed(4)).join(",")}`).join("|")] as const,

    nearby: (musicId: number) => ["map", "nearby", musicId] as const,
  },

  music: {
    all: ["music"] as const,
    detail: (id: number) => ["music", "detail", id] as const,

    search: (c: SearchCondition) =>
      (c.mode === "all"
        ? (["music", "search", "all", c.query] as const)
        : c.mode === "artist"
          ? (["music", "search", "artist", c.artist, c.music] as const)
          : (["music", "search", "music", c.music, c.artist] as const)),
    videoId: (id: number) => ["music", "video-id", id] as const,
  },

  user: {
    all: ["user"] as const,
    profile: (email: string) => ["user", "profile", email] as const,

    followList: (email: string, type: "follower" | "following", page: number) => ["user", "follow-list", email, type, page] as const,

    followListAll: ["user", "follow-list"] as const,
  },

  playlist: {
    all: ["playlist"] as const,
    detail: (id: number) => ["playlist", "detail", id] as const,

    mine: (email: string | null) => ["playlist", "mine", email] as const,

    mineAll: ["playlist", "mine"] as const,
    liked: (email: string | null) => ["playlist", "liked", email] as const,
    likedAll: ["playlist", "liked"] as const,
  },

  journey: {
    route: (startId: number, endId: number) => ["journey", "route", startId, endId] as const,
  },

  chart: {
    weekly: ["chart", "weekly"] as const,

    topDriver: ["chart", "topDriver"] as const,
  },

  taste: {
    analysis: ["taste", "analysis"] as const,
  },

  contest: {
    all: ["contest"] as const,
    current: ["contest", "current"] as const,
    entries: ["contest", "entries"] as const,
    mine: ["contest", "mine"] as const,
    detail: (artworkId: number) => ["contest", "detail", artworkId] as const,
    templates: ["contest", "templates"] as const,
  },

  realtime: {
    nearby: ["realtime", "nearby"] as const,

    layerUsers: (layer: number) => ["realtime", "layerUsers", layer] as const,
  },
} as const;

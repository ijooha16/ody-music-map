import type { LayerBox } from "@/types";

const round = (v: number) => v.toFixed(4);

export const API_ENDPOINTS = {
  health: "/bff/health",

  auth: {
    me: "/bff/auth/me",

    logout: "/bff/auth/logout",

    googleLogin: "/bff/auth/google",

    signup: "/bff/auth/signup",

    login: "/bff/auth/login",

    exchange: "/api/auth/exchange",

    completeTutorial: "/bff/auth/tutorial/complete",

    reissue: "/bff/auth/reissue",
  },

  user: {
    detail: (email: string) => `/bff/users/${encodeURIComponent(email)}`,

    nicknameAvailable: (nickname: string) => `/bff/users/nickname-available?nickname=${encodeURIComponent(nickname)}`,

    nickname: "/bff/user/nickname",

    image: "/bff/user/image",

    publicVisibility: "/bff/user/public",

    followInsert: "/bff/users/follow/insert",
    followDelete: "/bff/users/follow/delete",

    followList: (email: string, type: "follower" | "following", page = 0) =>
      `/bff/users/follow/list?email=${encodeURIComponent(email)}&type=${type}&page=${page}`,
  },

  map: {
    songs: (boxes: readonly LayerBox[]) => {
      const q = [`level=${boxes.length + 1}`];
      for (const b of boxes) {
        const k = b.layer * 2 + 1;
        q.push(`pc${k}min=${round(b.xMin)}`, `pc${k}max=${round(b.xMax)}`, `pc${k + 1}min=${round(b.yMin)}`, `pc${k + 1}max=${round(b.yMax)}`);
      }
      return `/bff/map/songs?${q.join("&")}`;
    },

    nearby: (musicId: number) => `/bff/map/nearby/${musicId}`,
  },

  music: {
    detail: (id: number) => `/bff/music/${id}`,

    like: "/bff/music/like",
    search: "/bff/music/search",

    play: "/bff/music/play",

    videoId: (id: number) => `/bff/music/${id}/video-id`,

    report: (id: number) => `/bff/music/${id}/report`,
  },

  playlist: {
    list: "/bff/playlists",

    mine: (email?: string | null) => (email ? `/bff/playlists/mine?email=${encodeURIComponent(email)}` : "/bff/playlists/mine"),
    liked: (email?: string | null) => (email ? `/bff/playlists/liked?email=${encodeURIComponent(email)}` : "/bff/playlists/liked"),
    detail: (id: number) => `/bff/playlists/${id}`,
    items: (id: number) => `/bff/playlists/${id}/items`,
    item: (id: number, musicId: number) => `/bff/playlists/${id}/items/${musicId}`,

    order: (id: number) => `/bff/playlists/${id}/order`,
    like: (id: number) => `/bff/playlists/${id}/like`,
  },

  realtime: {
    nearby: "/bff/realtime/nearby",

    ride: "/bff/realtime/ride",

    rideFleet: "/bff/realtime/ride/fleet",

    layerUsers: (layer: number) => `/bff/realtime/layers/${layer}/users`,

    reactions: "/bff/realtime/reactions",
  },

  constellation: {
    layout: "/bff/constellations/layout",
  },

  journey: {
    route: "/bff/journeys/route",
  },

  chart: {
    weekly: "/bff/charts/weekly",

    topDriver: "/bff/charts/top-driver",
  },

  contest: {
    current: "/bff/contests/current",

    match: "/bff/contests/match",

    templates: "/bff/contests/templates",

    generate: "/bff/contests/generate",

    entries: "/bff/contests/entries",

    mine: "/bff/contests/mine",

    like: (artworkId: number) => `/bff/contests/entries/${artworkId}/like`,

    detail: (artworkId: number) => `/bff/contests/entries/${artworkId}`,

    retry: (artworkId: number) => `/bff/contests/entries/${artworkId}/retry`,

    save: "/bff/contests/save",
  },

  taste: {
    analysis: "/bff/taste-analysis",
  },
} as const;

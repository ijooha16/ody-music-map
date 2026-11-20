export const PANEL_TYPES = ["song", "playlist", "feed", "journey", "friends", "chart"] as const;
export type PanelType = (typeof PANEL_TYPES)[number];

export const MAP_VIEW_MODES = ["default", "nearby", "constellation"] as const;
export type MapViewMode = (typeof MAP_VIEW_MODES)[number];

export const COLLAPSED_PEEK_PX = 28;

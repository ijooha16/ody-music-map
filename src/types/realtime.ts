import type { PlaySource } from "./play-history";

export interface RealtimeMessage<T> {
  type: RealtimeMessageType;

  seq: number;

  ts: number;
  payload: T;
}

export type RealtimeMessageType =
  | "PRESENCE_JOINED"
  | "VIEWPORT_SNAPSHOT"
  | "VIEWPORT_ENTER"
  | "VIEWPORT_MOVE"
  | "VIEWPORT_LEAVE"
  | "VIEWPORT_CELL_COUNTS"
  | "VIEWPORT_BULK_ENTER"
  | "VIEWPORT_RIDER_COUNT"
  | "NEARBY_SNAPSHOT"
  | "NEARBY_ENTER"
  | "NEARBY_MOVE"
  | "NEARBY_LEAVE"
  | "NEARBY_BULK_ENTER"
  | "NEARBY_RIDER_COUNT"

  | "RIDE_TRACK"
  | "RIDE_PLAYBACK"
  | "RIDE_PANEL"
  | "RIDE_VIEW"
  | "RIDE_VIEWPORT"
  | "RIDE_VIEWPORT_ENTER"
  | "RIDE_VIEWPORT_MOVE"
  | "RIDE_VIEWPORT_LEAVE"
  | "RIDE_VIEWPORT_CELL_COUNTS"
  | "RIDE_VIEWPORT_BULK_ENTER"
  | "RIDE_VIEWPORT_RIDER_COUNT"
  | "RIDE_RIDER_JOINED"
  | "RIDE_RIDER_LEFT"
  | "RIDE_ENDED"

  | "REACTION"
  | "PRESENCE_ERROR";

export interface JoinRequest {
  requestSeq: number;
  layer: number;

  musicId: number;
}

export interface PresenceJoined {
  requestSeq: number;
  layer: number;
  musicId: number;
}

export interface PlayRequest {
  musicId: number;
  source: PlaySource;

  layer?: number;
}

export interface PlayResponse {
  playHistoryId: number;
  musicId: number;
  layer: number;

  x: number;
  y: number;

  cellX: number;
  cellY: number;
}

export interface LayerBound {
  layer: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ViewportRequest {
  requestSeq: number;
  layer: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;

  ancestorBounds: LayerBound[];
}

export interface ViewportUser {
  email: string;
  nickname: string | null;
  imageUrl: string | null;

  riderCount: number;
}

export interface ViewportMusicGroup {
  musicId: number;
  x: number;
  y: number;
  users: ViewportUser[];
}

export interface ViewportCellCount {
  cellX: number;
  cellY: number;

  x: number;
  y: number;
  count: number;
}

export interface ViewportSnapshot {
  requestSeq: number;

  mode: "INDIVIDUAL" | "CLUSTERED";
  layer: number;
  groups: ViewportMusicGroup[];
  resolution: number | null;
  cells: ViewportCellCount[];
}

export interface ViewportDelta {
  requestSeq: number;
  email: string;
  nickname: string | null;
  imageUrl: string | null;
  musicId: number | null;
  x: number | null;
  y: number | null;
  riderCount: number | null;
}

export interface ViewportCellCounts {
  requestSeq: number;
  layer: number;
  resolution: number;
  cells: ViewportCellCount[];
}

export interface ViewportCloseRequest {
  requestSeq: number;
}

export interface ViewportBulkEnter {
  requestSeq: number;
  musicId: number;
  x: number;
  y: number;
  users: ViewportUser[];
}

export interface ViewportRiderCount {
  requestSeq: number;
  email: string;
  riderCount: number;
}

export interface LayerUsersSnapshot {
  layer: number;
  groups: ViewportMusicGroup[];
}

export interface NearbyPerson {
  email: string;

  nickname: string | null;
  imageUrl: string | null;
  meetingCount: number;

  riderCount: number;

  musicId: number;

  x: number | null;
  y: number | null;

  distance: number;
}

export interface NearbySnapshot {
  anchorMusicId: number;

  snapshotSeq: number;

  people: NearbyPerson[];
}

export interface NearbyChange {
  email: string;
  nickname: string | null;
  imageUrl: string | null;
  meetingCount: number | null;
  riderCount: number | null;
  musicId: number | null;

  x: number | null;
  y: number | null;
}

export interface NearbyBulkEnter {
  musicId: number;
  people: NearbyChange[];
}

export interface NearbyRiderCount {
  email: string;
  riderCount: number;
  musicId: number;
}

export type RidePlaybackState = "PLAYING" | "PAUSED";

export type RidePlaybackEvent = "PLAY" | "PAUSE" | "SEEK" | "DRIFT";

export type RidePanelTab = "nearby" | "info" | "playlists";

export interface RidePanelPayload {
  open: boolean;
  musicId: number | null;
  tab: RidePanelTab | null;
}

export interface RideRequest {
  captainEmail: string;
}

export interface RideResponse {
  captainEmail: string;
  playHistoryId: number;
  musicId: number;
  layer: number;
  x: number;
  y: number;
  cellX: number;
  cellY: number;
  playback: RidePlaybackState;
  positionMs: number;

  snapshotSeq: number;

  panel: RidePanelPayload;
}

export interface DismountResponse {
  musicId: number;
  layer: number;
  x: number;
  y: number;
  cellX: number;
  cellY: number;
}

export interface DisbandResponse {
  riderCount: number;

  musicId: number;
  layer: number;
}

export interface RideTrackPayload {
  musicId: number;
  layer: number;
  x: number;
  y: number;
  playable: boolean;
  serverTs: number;

  playHistoryId: number | null;
}

export interface RideRiderJoinedPayload {
  email: string;

  nickname: string | null;

  riderCount: number;
}

export interface RidePlaybackPayload {
  event: RidePlaybackEvent;
  state: RidePlaybackState;
  positionMs: number;
  serverTs: number;
}

export interface RideRider {
  email: string;
  nickname: string | null;
  imageUrl: string | null;
}

export interface RideRiderLeftPayload {
  email: string;

  riderCount: number;
}

export interface RideEndedPayload {
  captainEmail: string;
  reason: "CAPTAIN_LEFT" | "CAPTAIN_ENDED";
  musicId: number;
  layer: number;
  x: number;
  y: number;
  cellX: number;
  cellY: number;
}

export interface RidePlaybackRequest {
  event: RidePlaybackEvent;
  positionMs: number;
}

export interface RidePanelRequest {
  open: boolean;
  musicId?: number;
  tab?: RidePanelTab;
}

export type RideViewKind = "default" | "journey" | "playlist" | "nearby";

export interface RideViewRequest {
  kind: RideViewKind;
  startMusicId?: number;
  endMusicId?: number;
  playlistId?: number;
  centerMusicId?: number;
}

export interface RideViewPayload {
  kind: RideViewKind;
  startMusicId: number | null;
  endMusicId: number | null;
  playlistId: number | null;
  centerMusicId: number | null;
}

export type WebSocketErrorCode =
  | "PRESENCE_NO_ANCHOR"
  | "PRESENCE_LOCATION_NULL"
  | "PRESENCE_LAYER_INVALID"
  | "PRESENCE_JOIN_INVALID"
  | "PRESENCE_VIEWPORT_INVALID"
  | "PRESENCE_STALE"
  | "PRESENCE_NOT_CONNECTED"

  | "RIDE_NOT_CAPTAIN"
  | "RIDE_PLAYBACK_INVALID"
  | "RIDE_PANEL_INVALID"

  | "RIDE_VIEW_INVALID";

export interface PresenceErrorPayload {
  code: WebSocketErrorCode;
  message: string;

  requestSeq?: number;
}

export interface CrowdCell {
  x: number;
  y: number;
  count: number;
}

export interface ReactionPayload {
  fromEmail: string;

  reactionKey: string;

  sentAt: string;
}

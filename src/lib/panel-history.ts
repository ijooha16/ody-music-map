export type FollowType = "follower" | "following";

export type PanelReturn =
  | { panel: "journey" }
  | { panel: "playlist"; playlistId: number }
  | { panel: "song"; musicId: number }
  | { panel: "friends" }
  | { panel: "chart" }

  | { panel: "feed"; profileEmail: string | null; follows?: FollowType | null };

export const PANEL_HISTORY_MAX = 10;

interface PanelSnapshotSource {
  activePanel: string | null;
  musicId: number | null;
  playlistId: number | null;
  profileEmail: string | null;
  feedFollows: FollowType | null;
}

export function snapshotOf(s: PanelSnapshotSource): PanelReturn | null {
  switch (s.activePanel) {
    case "song":
      return s.musicId != null ? { panel: "song", musicId: s.musicId } : null;
    case "playlist":
      return s.playlistId != null ? { panel: "playlist", playlistId: s.playlistId } : null;
    case "journey":
      return { panel: "journey" };
    case "friends":
      return { panel: "friends" };
    case "chart":
      return { panel: "chart" };
    case "feed":
      return { panel: "feed", profileEmail: s.profileEmail, follows: s.feedFollows };
    default:
      return null;
  }
}

export function sameReturn(a: PanelReturn, b: PanelReturn): boolean {
  if (a.panel !== b.panel) return false;
  switch (a.panel) {
    case "song":
      return a.musicId === (b as typeof a).musicId;
    case "playlist":
      return a.playlistId === (b as typeof a).playlistId;
    case "feed":
      return a.profileEmail === (b as typeof a).profileEmail && (a.follows ?? null) === ((b as typeof a).follows ?? null);
    default:
      return true;
  }
}

export function pushHistory(history: readonly PanelReturn[], current: PanelReturn | null, target: PanelReturn, max = PANEL_HISTORY_MAX): PanelReturn[] {
  if (!current || sameReturn(current, target)) return [...history];
  const next = [...history, current];
  return next.length > max ? next.slice(next.length - max) : next;
}

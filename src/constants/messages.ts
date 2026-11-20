export const PLAYBACK_BLOCKED = {
  noVideo: {
    badge: "재생 불가",
    notice: "아직 준비 중인 곡이에요",
    detail: "아직 재생 준비 중인 곡이에요. 오른쪽 위 신고 버튼으로 알려 주시면 음원을 채워 넣을게요.",
    ref: "SONG-04",
    retryable: false,
  },

  notSearched: {
    badge: "재생 준비 중",
    notice: "음원을 아직 찾는 중이에요. 잠시 후 다시 눌러 주세요",
    detail: "이 곡의 음원을 아직 찾지 못했습니다. 잠시 후 다시 시도해 주세요.",
    ref: null,
    retryable: true,
  },

  lookupFailed: {
    badge: "재생 준비 중",
    notice: "지금은 재생할 수 없어요. 잠시 후 다시 눌러 주세요",
    detail: "음원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    ref: null,
    retryable: true,
  },
} as const;

export type PlaybackBlocked = (typeof PLAYBACK_BLOCKED)[keyof typeof PLAYBACK_BLOCKED];

export const SKIPPED_UNPLAYABLE = "재생할 수 없는 곡을 건너뛰었어요";

export const RIDE_REJECTED = {
  RIDE_SELF: "자기 자신은 따라갈 수 없어요",
  RIDE_CAPTAIN_INACTIVE: "지금은 따라갈 수 없는 사용자예요",
  RIDE_ALREADY_RIDING: "이미 따라가는 중이에요. 먼저 내려 주세요",
  RIDE_CHAIN_FORBIDDEN: "따라가기는 한 단계까지만 가능해요",
  RIDE_FULL: "따라가는 인원이 가득 찼어요",
  RIDE_NOT_CAPTAIN: "따라가는 중에는 할 수 없어요. 먼저 내려 주세요",
  RIDE_STALE: "상태가 바뀌었어요. 화면을 새로 고친 뒤 다시 시도해 주세요",

  PRESENCE_ERROR: "실시간 연결이 끊겼어요. 잠시 후 다시 시도해 주세요",
  UNKNOWN: "따라가기를 시작하지 못했어요",
} as const;

export const RIDE_CAPTAIN_UNREACHABLE = "지금은 이 사람을 따라갈 수 없어요. 잠시 후 다시 시도해 주세요";

export const RIDE_ENDED_BY_CAPTAIN = (who: string) => `${who} 님이 떠나 따라가기가 끝났어요`;

export const RIDE_ENDED_BY_DISBAND = (who: string) => `${who} 님이 따라가기를 끝냈어요. 이 자리에서 이어가요`;

export const RIDE_DISBANDED = (count: number) => `${count}명을 내려 드렸어요`;

export const RIDE_DISBAND_REJECTED = {
  RIDE_NOT_CAPTAIN: "지금은 따라오는 사람이 없어요",
  PRESENCE_ERROR: "연결이 불안정해요. 잠시 후 다시 시도해 주세요",
  UNKNOWN: "강제 하차에 실패했어요. 잠시 후 다시 시도해 주세요",
} as const;

export const LIKE_FAILED = "좋아요를 반영하지 못했어요. 잠시 후 다시 시도해 주세요";

export const RIDE_RESUMING = "연결이 불안정해요. 따라가기를 다시 잇는 중이에요";

export const RIDE_RESUME_FAILED = (who: string) => `${who} 님과 다시 연결하지 못해 따라가기를 마쳤어요`;

export const RIDE_RECONNECTING = {
  title: (who: string) => `${who} 님과 연결이 끊겼어요`,
  sub: "다시 연결하는 중 · 하차하면 이 자리에서 이어갑니다",
} as const;

export const REACTION_REJECTED = {
  REACTION_SELF: "자기 자신에게는 반응을 보낼 수 없어요",
  REACTION_NOT_NEARBY: "같은 영역에 있는 사람에게만 보낼 수 있어요",
  REACTION_COOLDOWN: "같은 사람에게는 잠시 뒤에 다시 보낼 수 있어요",
  PRESENCE_ERROR: "연결이 불안정해요. 잠시 후 다시 시도해 주세요",
  UNKNOWN: "반응을 보내지 못했어요",
} as const;

export const RIDING_JOURNEY_BLOCKED = "따라가는 중에는 여정을 만들 수 없어요. 하차한 뒤에 해 주세요";

export const RIDING_LOCKED = "따라가는 중에는 직접 고를 수 없어요. 하차하면 다시 돼요";

export const RIDING_MAP_LOCKED = "따라가는 중에는 지도를 움직일 수 없어요. 하차하면 다시 돼요";

export const RIDING_CONTEST_BLOCKED = "따라가는 중에는 이벤트를 열 수 없어요. 하차하면 다시 돼요";

export const CHANGED = {
  playlistItemAdded: (name: string | null) => (name ? `「${name}」에 담았어요` : "플레이리스트에 담았어요"),
  playlistItemDuplicate: "이미 담긴 곡이에요",
  playlistItemRemoved: "플레이리스트에서 뺐어요",
  playlistCreated: (name: string) => `「${name}」 만들었어요`,
  playlistDeleted: (name: string | null) => (name ? `「${name}」 지웠어요` : "플레이리스트를 지웠어요"),
  nicknameChanged: (nickname: string) => `닉네임을 바꿨어요 · ${nickname}`,
  profileImageChanged: "프로필 사진을 바꿨어요",
  musicLiked: "좋아요했어요",
  musicUnliked: "좋아요를 취소했어요",
  playlistLiked: "플레이리스트를 좋아요했어요",
  playlistUnliked: "플레이리스트 좋아요를 취소했어요",
  followed: "팔로우했어요",
  unfollowed: "팔로우를 취소했어요",
  rideStarted: (who: string) => `${who} 님을 따라가요`,
  tasteGenerated: "취향 리포트를 만들었어요",
  loggedOut: "로그아웃했어요",
} as const;

export const HOME_NO_COORDS = "이 곡은 지도에 자리가 없어서 갈 수 없어요";
export const HOME_LOOKUP_FAILED = "곡의 자리를 못 불러왔어요. 다시 눌러 주세요";

export const FOLLOW_FAILED = "팔로우를 반영하지 못했어요. 잠시 후 다시 시도해 주세요";
export const CHANGE_FAILED = "반영하지 못했어요. 잠시 후 다시 시도해 주세요";

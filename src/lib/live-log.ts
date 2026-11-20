import { LIVE_HEADERS } from "./api-response";

export function logLiveResponse(path: string, res: Response, body: unknown, ms: number) {
  if (process.env.NODE_ENV === "production") return;
  if (res.headers.get(LIVE_HEADERS.source) !== "live") return;

  const upstream = res.headers.get(LIVE_HEADERS.upstream) ?? "-";
  const envelope = body as { success?: boolean; data?: unknown; error?: { code?: string; message?: string } } | null;
  const okFlag = res.ok && envelope?.success === true;
  const badge = okFlag ? "✅ 연결됨" : "❌ 실패";
  const tone = okFlag ? "color:#4fe3ce" : "color:#ff7a90";

  console.groupCollapsed(`%c[ODY ${badge}]%c ${path} %c${res.status} · ${Math.round(ms)}ms`, `${tone};font-weight:600`, "color:inherit", "color:#93a4c4");
  console.log("백엔드 경로", upstream);
  if (okFlag) {
    const data = envelope?.data;
    if (Array.isArray(data)) console.log(`데이터 (${data.length}건)`, data);
    else console.log("데이터", data);
  } else {
    console.log("오류 코드", envelope?.error?.code ?? `HTTP ${res.status}`);
    console.log("메시지", envelope?.error?.message ?? "(없음)");
  }
  console.groupEnd();
}

interface VideoIdResolution {
  status: "pending" | "error" | "success";

  lookup: "found" | "notFound" | "unsearched";
  videoId: string | null;

  error: { code?: string; message?: string } | null;

  fromCache: boolean;

  where: string;
}

export function logVideoId(musicId: number, r: VideoIdResolution) {
  if (process.env.NODE_ENV === "production") return;

  const [badge, tone, why] =
    r.status === "pending"
      ? ["⏳ 조회 중", "color:#93a4c4", "아직 응답 전이라 임베드가 대기한다"]
      : r.status === "error"
        ? ["❌ 조회 실패", "color:#ff7a90", r.error?.message ?? "(메시지 없음)"]
        : r.lookup === "found"
          ? ["🔊 재생 가능", "color:#4fe3ce", "임베드가 이 영상을 건다"]
          : r.lookup === "notFound"
            ? ["🔇 준비 중", "color:#ffd166", '백엔드가 유튜브를 찾아봤는데 없었다 ("none"). 다시 눌러도 같은 답이라 여정에서는 건너뛴다 (SONG-04)']
            : ["❓ 아직 안 찾아봄", "color:#93a4c4", "백엔드가 아직 검색하지 않았다 (null). 다시 부르면 채워질 수 있다"];

  const source = r.status === "success" && r.fromCache ? "캐시" : "조회";

  console.groupCollapsed(`%c[ODY videoId ${badge}]%c musicId ${musicId} · ${r.where} %c(${source})`, `${tone};font-weight:600`, "color:inherit", "color:#93a4c4");
  console.log("이유", why);
  console.log("videoId", r.videoId ?? "(없음)");
  if (r.status === "error") console.log("오류 코드", r.error?.code ?? "UNKNOWN");
  console.log("백엔드 경로", "/api/music/videoid");
  console.groupEnd();
}

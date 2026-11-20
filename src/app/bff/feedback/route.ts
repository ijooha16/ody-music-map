import { failLive, ok, okLive } from "@/lib/api-response";
import { backendPost, BackendError, isBackendEnabled } from "@/lib/backend";
import { isLoopbackBackend, shouldPersistSurvey } from "@/lib/survey-persistence";

export async function POST(req: Request) {
  const upstream = "/api/feedback";
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return failLive("INVALID_INPUT", "요청 본문이 JSON 이 아닙니다.", 400, upstream);
  }

  const requestUrl = new URL(req.url);
  if (!shouldPersistSurvey({
    backendEnabled: isBackendEnabled(),
    hostname: requestUrl.hostname,
    localTestDatabase: process.env.SURVEY_TEST_DATABASE === "local"
      && isLoopbackBackend(process.env.BACKEND_ORIGIN),
  })) {
    console.debug("[survey:skipped] non-persistent test context");
    return ok({ feedbackId: 0 });
  }

  try {
    const data = await backendPost<{ feedbackId: number }>(upstream, body);
    return okLive(data, upstream);
  } catch (e) {
    const err = e as BackendError;

    return failLive(err.status === 400 ? "INVALID_INPUT" : "INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}

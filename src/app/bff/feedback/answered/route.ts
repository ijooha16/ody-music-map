import { ok, okLive, failLive } from "@/lib/api-response";
import { backendGet, BackendError, isBackendEnabled } from "@/lib/backend";
import { isLoopbackBackend, shouldPersistSurvey } from "@/lib/survey-persistence";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const anonymousId = requestUrl.searchParams.get("anonymousId");
  if (!anonymousId) return ok([]);

  const upstream = `/api/feedback/answered?anonymousId=${encodeURIComponent(anonymousId)}`;

  if (!shouldPersistSurvey({
    backendEnabled: isBackendEnabled(),
    hostname: requestUrl.hostname,
    localTestDatabase: process.env.SURVEY_TEST_DATABASE === "local"
      && isLoopbackBackend(process.env.BACKEND_ORIGIN),
  })) return ok([]);

  try {
    return okLive(await backendGet<unknown[]>(upstream), upstream);
  } catch (e) {
    const err = e as BackendError;
    return failLive(err.status === 400 ? "INVALID_INPUT" : "INTERNAL_ERROR", err.message, err.status || 502, upstream);
  }
}

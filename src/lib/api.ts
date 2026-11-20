import { API_ENDPOINTS, STORAGE_KEYS } from "@/constants";
import type { ApiErrorCode, ApiResponse } from "@/types";
import { readStorage, readStorageScope, removeStorage, writeStorage } from "./storage";
import { logLiveResponse } from "./live-log";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const NO_REISSUE_PATHS: readonly string[] = [
  API_ENDPOINTS.auth.reissue,
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.signup,
  API_ENDPOINTS.auth.exchange,
];

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode | "UNKNOWN",
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let reissuing: Promise<boolean> | null = null;

async function reissueAccessToken(): Promise<boolean> {
  reissuing ??= (async () => {
    try {
      const res = await fetch(`${BASE_URL}${API_ENDPOINTS.auth.reissue}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
      });
      const body = (await res.json().catch(() => null)) as ApiResponse<{ accessToken: string }> | null;
      if (!res.ok || !body?.success || !body.data?.accessToken) {
        removeStorage(STORAGE_KEYS.accessToken);
        return false;
      }

      if (readStorage<string>(STORAGE_KEYS.accessToken) == null) return false;

      writeStorage(STORAGE_KEYS.accessToken, body.data.accessToken, readStorageScope(STORAGE_KEYS.accessToken) ?? "local");
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        reissuing = null;
      }, 0);
    }
  })();

  return reissuing;
}

function request(path: string, init?: RequestInit): Promise<Response> {
  const token = readStorage<string>(STORAGE_KEYS.accessToken);

  const isForm = init?.body instanceof FormData;
  return fetch(`${BASE_URL}${path}`, {
    ...init,

    credentials: "include",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json; charset=UTF-8" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const t0 = performance.now();
  let res = await request(path, init);

  const canReissue = res.status === 401 && !NO_REISSUE_PATHS.includes(path) && readStorage<string>(STORAGE_KEYS.accessToken) != null;
  if (canReissue && (await reissueAccessToken())) {
    res = await request(path, init);
  }

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  logLiveResponse(path, res, body, performance.now() - t0);

  if (!body) throw new ApiError(res.status, "INTERNAL_ERROR", "응답을 읽을 수 없습니다.");
  if (!body.success) throw new ApiError(res.status, body.error?.code ?? "UNKNOWN", body.error?.message ?? "요청에 실패했습니다.");

  return body.data;
}

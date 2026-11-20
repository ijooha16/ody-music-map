import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data, error: null }, { status });
}

export function fail(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ success: false, data: null, error: { code, message } }, { status });
}

export const LIVE_HEADERS = { source: "x-ody-source", upstream: "x-ody-upstream" } as const;

function markLive(res: NextResponse, upstream: string) {
  res.headers.set(LIVE_HEADERS.source, "live");
  res.headers.set(LIVE_HEADERS.upstream, upstream);
  return res;
}

export function okLive<T>(data: T, upstream: string, status = 200) {
  return markLive(ok(data, status), upstream);
}

export function failLive(code: ApiErrorCode, message: string, status: number, upstream: string) {
  return markLive(fail(code, message, status), upstream);
}

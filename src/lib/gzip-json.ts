import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { MAP_SONGS_GZIP_LEVEL } from "@/constants";
import { acceptsGzip } from "./accept-encoding";
import { LIVE_HEADERS } from "./api-response";
import { matchesTag } from "./content-tag";

const gzipAsync = promisify(gzip);

export async function okLiveGzip<T>(req: Request, data: T, upstream: string, tag?: string): Promise<NextResponse> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    vary: "Accept-Encoding",
    [LIVE_HEADERS.source]: "live",
    [LIVE_HEADERS.upstream]: upstream,
  };
  if (tag) {
    headers.etag = `W/"${tag}"`;
    headers["cache-control"] = "private, no-cache";
    if (matchesTag(req.headers.get("if-none-match"), tag)) return new NextResponse(null, { status: 304, headers });
  }
  const json = JSON.stringify({ success: true, data, error: null });
  if (!acceptsGzip(req.headers.get("accept-encoding"))) return new NextResponse(json, { status: 200, headers });
  const body = await gzipAsync(json, { level: MAP_SONGS_GZIP_LEVEL });
  return new NextResponse(new Uint8Array(body), { status: 200, headers: { ...headers, "content-encoding": "gzip" } });
}

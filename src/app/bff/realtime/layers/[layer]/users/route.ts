import { failLive, okLive } from "@/lib/api-response";
import { backendGet, BackendError } from "@/lib/backend";
import type { LayerUsersSnapshot } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ layer: string }> }) {
  const { layer } = await params;
  const upstream = `/api/realtime/layers/${layer}/users`;
  try {
    return okLive(await backendGet<LayerUsersSnapshot>(upstream), upstream);
  } catch (e) {
    const err = e as BackendError;

    const code = err.status === 404 ? "NOT_IMPLEMENTED" : err.status === 400 ? "INVALID_INPUT" : "INTERNAL_ERROR";
    return failLive(code, err.message, err.status || 502, upstream);
  }
}

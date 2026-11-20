import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, CHANGED, STORAGE_KEYS } from "@/constants";
import { useToastStore } from "@/stores/use-toast-store";
import { clearPersistedQueries } from "@/lib/query-persist";
import { readStorage, removeStorage } from "@/lib/storage";
import type { ApiResponse } from "@/types";

export function runLogout(deps: { readToken: () => string | null; endSession: (token: string | null) => Promise<void>; clearLocal: () => void }): void {
  const token = deps.readToken();
  void deps.endSession(token);
  deps.clearLocal();
}

export async function endServerSession(token: string | null, fetchImpl: typeof fetch = fetch): Promise<void> {
  const post = (t: string | null) => fetchImpl(API_ENDPOINTS.auth.logout, { method: "POST", headers: t ? { Authorization: `Bearer ${t}` } : undefined });
  try {
    if ((await post(token)).status !== 401) return;
    const res = await fetchImpl(API_ENDPOINTS.auth.reissue, { method: "POST" });
    const body = (await res.json().catch(() => null)) as ApiResponse<{ accessToken: string }> | null;
    if (body?.success && body.data.accessToken) await post(body.data.accessToken);
  } catch {
    /* 네트워크가 끊겼거나 서버가 죽었다. 로컬 로그아웃은 이미 끝났다 */
  }
}

export function useLogoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      runLogout({
        readToken: () => readStorage<string>(STORAGE_KEYS.accessToken),
        endSession: endServerSession,
        clearLocal: () => {
          removeStorage(STORAGE_KEYS.accessToken);
          qc.clear();

          clearPersistedQueries();
        },
      });

      useToastStore.getState().show(CHANGED.loggedOut);
      return null;
    },
  });
}

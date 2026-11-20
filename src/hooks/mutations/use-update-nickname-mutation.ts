import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, CHANGED, QUERY_KEYS } from "@/constants";
import { useToastStore } from "@/stores/use-toast-store";
import { api } from "@/lib/api";
import { snapshotQueries } from "@/lib/query-snapshot";
import type { User, UserProfile } from "@/types";

export function useUpdateNicknameMutation() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: (nickname: string) =>
      api<{ nickname: string }>(API_ENDPOINTS.user.nickname, { method: "PATCH", body: JSON.stringify({ nickname }) }),
    onMutate: async (nickname) => {
      const restore = await snapshotQueries(qc, [QUERY_KEYS.auth.me, QUERY_KEYS.user.all]);
      const me = qc.getQueryData<User>(QUERY_KEYS.auth.me);
      qc.setQueryData<User>(QUERY_KEYS.auth.me, (prev) => (prev ? { ...prev, nickname } : prev));
      if (me) qc.setQueryData<UserProfile>(QUERY_KEYS.user.profile(me.email), (prev) => (prev ? { ...prev, nickname } : prev));
      return restore;
    },
    onError: (_e, _nickname, restore) => restore?.(),
    onSuccess: (data) => {
      showToast(CHANGED.nicknameChanged(data.nickname));
      qc.invalidateQueries({ queryKey: QUERY_KEYS.auth.me });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.user.all });
    },
  });
}

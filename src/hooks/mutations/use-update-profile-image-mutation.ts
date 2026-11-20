import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, CHANGED, QUERY_KEYS } from "@/constants";
import { useToastStore } from "@/stores/use-toast-store";
import { api } from "@/lib/api";
import { snapshotQueries } from "@/lib/query-snapshot";
import type { User, UserProfile } from "@/types";

export function useUpdateProfileImageMutation() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const setImage = (imageUrl: string) => {
    const me = qc.getQueryData<User>(QUERY_KEYS.auth.me);
    qc.setQueryData<User>(QUERY_KEYS.auth.me, (prev) => (prev ? { ...prev, imageUrl } : prev));
    if (me) qc.setQueryData<UserProfile>(QUERY_KEYS.user.profile(me.email), (prev) => (prev ? { ...prev, imageUrl } : prev));
  };
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file, file.name);
      return api<{ imageUrl: string }>(API_ENDPOINTS.user.image, { method: "PATCH", body: form });
    },
    onMutate: async (file) => {
      const restore = await snapshotQueries(qc, [QUERY_KEYS.auth.me, QUERY_KEYS.user.all]);
      const url = URL.createObjectURL(file);
      setImage(url);
      return { restore, url };
    },
    onError: (_e, _file, ctx) => {
      ctx?.restore();
      if (ctx) URL.revokeObjectURL(ctx.url);
    },
    onSuccess: (data, _file, ctx) => {
      setImage(data.imageUrl);
      if (ctx) URL.revokeObjectURL(ctx.url);
      showToast(CHANGED.profileImageChanged);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.auth.me });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.user.all });
    },
  });
}

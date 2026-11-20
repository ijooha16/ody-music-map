import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { withFollow, withFollowInList } from "@/lib/optimistic";
import { snapshotQueries } from "@/lib/query-snapshot";
import { API_ENDPOINTS, CHANGED, FOLLOW_FAILED, QUERY_KEYS } from "@/constants";
import { useToastStore } from "@/stores/use-toast-store";
import type { FollowListResponse, FollowResponse, User, UserProfile } from "@/types";

export function useFollowMutation() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: (followeeEmail: string) =>
      api<FollowResponse>(API_ENDPOINTS.user.followInsert, { method: "POST", body: JSON.stringify({ followeeEmail }) }),
    onMutate: (followeeEmail) => applyFollow(qc, followeeEmail, true),
    onSuccess: () => {
      showToast(CHANGED.followed);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.user.all });
    },
    onError: (_e, _email, restore) => {
      restore?.();
      showToast(FOLLOW_FAILED);
    },
  });
}

async function applyFollow(qc: QueryClient, email: string, follow: boolean) {
  const restore = await snapshotQueries(qc, [QUERY_KEYS.user.all]);
  const me = qc.getQueryData<User>(QUERY_KEYS.auth.me)?.email;
  qc.setQueryData<UserProfile>(QUERY_KEYS.user.profile(email), (prev) => withFollow(prev, follow, "target"));
  if (me) qc.setQueryData<UserProfile>(QUERY_KEYS.user.profile(me), (prev) => withFollow(prev, follow, "me"));
  qc.setQueriesData<FollowListResponse>({ queryKey: QUERY_KEYS.user.followListAll }, (prev) => withFollowInList(prev, email, follow));
  return restore;
}

export function useUnfollowMutation() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  return useMutation({
    mutationFn: (followeeEmail: string) =>
      api<FollowResponse>(API_ENDPOINTS.user.followDelete, { method: "POST", body: JSON.stringify({ followeeEmail }) }),
    onMutate: (followeeEmail) => applyFollow(qc, followeeEmail, false),
    onSuccess: () => {
      showToast(CHANGED.unfollowed);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.user.all });
    },
    onError: (_e, _email, restore) => {
      restore?.();
      showToast(FOLLOW_FAILED);
    },
  });
}

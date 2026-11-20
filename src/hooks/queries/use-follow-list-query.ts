import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import { api } from "@/lib/api";
import type { FollowListResponse } from "@/types";

export function useFollowListQuery(email: string, type: "follower" | "following", page = 0, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.user.followList(email, type, page),
    queryFn: () => api<FollowListResponse>(API_ENDPOINTS.user.followList(email, type, page)),
    enabled: enabled && !!email,
  });
}

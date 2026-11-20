import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import { api } from "@/lib/api";
import { nicknameError } from "@/lib/auth-rules";

export function useNicknameAvailableQuery(nickname: string) {
  const value = nickname.trim();
  return useQuery({
    queryKey: QUERY_KEYS.auth.nicknameAvailable(value),

    queryFn: () => api<{ available: boolean }>(API_ENDPOINTS.user.nicknameAvailable(value)),
    enabled: !nicknameError(value),
    staleTime: 30 * 1000,
  });
}

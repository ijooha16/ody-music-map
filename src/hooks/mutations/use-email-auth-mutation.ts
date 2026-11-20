import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, STORAGE_KEYS } from "@/constants";
import { api } from "@/lib/api";
import { writeStorage } from "@/lib/storage";

interface Credentials {
  email: string;
  password: string;

  nickname?: string;

  remember?: boolean;
}

interface TokenResponse {
  accessToken: string;
}

function useTokenMutation(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password, nickname }: Credentials) =>
      api<TokenResponse>(path, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password, ...(nickname ? { nickname: nickname.trim() } : {}) }),
      }),
    onSuccess: ({ accessToken }, { remember = true }) => {
      writeStorage(STORAGE_KEYS.accessToken, accessToken, remember ? "local" : "session");

      qc.clear();
    },
  });
}

export const useSignupMutation = () => useTokenMutation(API_ENDPOINTS.auth.signup);
export const useLoginMutation = () => useTokenMutation(API_ENDPOINTS.auth.login);

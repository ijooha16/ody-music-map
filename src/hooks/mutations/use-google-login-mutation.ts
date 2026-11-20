import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, STORAGE_KEYS } from "@/constants";
import { api } from "@/lib/api";
import { writeStorage } from "@/lib/storage";
import type { Email } from "@/types";

interface GoogleLoginResponse {
  accessToken: string;

  user: { email: Email; name: string | null; nickname: string | null; imageUrl: string | null };
}

export function useGoogleLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idToken: string) =>
      api<GoogleLoginResponse>(API_ENDPOINTS.auth.googleLogin, { method: "POST", body: JSON.stringify({ idToken }) }),
    onSuccess: ({ accessToken }) => {
      writeStorage(STORAGE_KEYS.accessToken, accessToken);

      qc.clear();
    },
  });
}

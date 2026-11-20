import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS, type ReactionKey } from "@/constants";

interface Input {
  toEmail: string;
  reactionKey: ReactionKey;
}

export function useSendReactionMutation() {
  return useMutation({
    mutationFn: (body: Input) =>
      api<null>(API_ENDPOINTS.realtime.reactions, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

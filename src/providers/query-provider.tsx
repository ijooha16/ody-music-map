"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState, type ReactNode } from "react";
import AnalyticsProvider from "./analytics-provider";
import { track } from "@/lib/analytics/client";
import { startQueryPersist } from "@/lib/query-persist";

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (_error, query) => {
        track("feature_request_failed", { feature: String(query.queryKey[0]), operation: String(query.queryKey[1] ?? "query") });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  useEffect(() => startQueryPersist(queryClient), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

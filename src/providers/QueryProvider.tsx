import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactNode } from "react";

// react-query cache with AsyncStorage persistence.
//
// Goal (perf/screen-load-caching): on a cold session, paint cached data from
// disk immediately, then revalidate in the background (stale-while-revalidate),
// instead of showing a blocking spinner while every screen re-fetches.
//
// NOTE: this commit only wires the provider + persistence. No screen uses
// useQuery yet, so there is no behavior change until hooks are migrated in a
// later step. Per-query staleTime (catalog ~5min vs user-state always-stale)
// is set at each useQuery call site then, not here.

const ONE_DAY_MS = 1000 * 60 * 60 * 24;
const FIVE_MIN_MS = 1000 * 60 * 5;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Conservative default; individual queries override per data type.
      staleTime: FIVE_MIN_MS,
      // Keep unused/persisted data around long enough to survive an idle gap.
      gcTime: ONE_DAY_MS,
      retry: 2,
      // React Native has no window-focus event; SWR is driven by refetchOnMount.
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "ARTIFACT_QUERY_CACHE",
  // Coalesce rapid cache writes to avoid thrashing AsyncStorage.
  throttleTime: 1000,
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Discard persisted cache older than a day on restore.
        maxAge: ONE_DAY_MS,
        // Bump to force-invalidate ALL persisted cache (e.g. after a data
        // model change that makes old cached shapes incompatible).
        buster: "v1",
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

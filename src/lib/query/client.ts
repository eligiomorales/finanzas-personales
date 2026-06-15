import { QueryClient } from '@tanstack/react-query'

/** Shared stale window: show cached data instantly, refetch in background after this. */
export const REMOTE_STALE_TIME_MS = 30_000

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: REMOTE_STALE_TIME_MS,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  })
}

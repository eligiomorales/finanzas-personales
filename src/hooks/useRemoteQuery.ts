import { useQuery, type QueryKey } from '@tanstack/react-query'
import { useDataContext } from '@/contexts/DataContext'
import { REMOTE_STALE_TIME_MS } from '@/lib/query/client'

export function useRemoteQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: { enabled?: boolean },
) {
  const { mode, coupleId } = useDataContext()

  return useQuery({
    queryKey,
    queryFn,
    enabled: mode === 'remote' && !!coupleId && (options?.enabled ?? true),
    staleTime: REMOTE_STALE_TIME_MS,
    placeholderData: (previousData) => previousData,
  })
}

export function isInitialRemoteLoad<T>(query: { isPending: boolean; data: T | undefined }): boolean {
  return query.isPending && query.data === undefined
}

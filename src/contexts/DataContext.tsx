import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { QueryClientProvider, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { createDexieRepositories } from '@/lib/repositories/dexie-repositories'
import { createSupabaseRepositories } from '@/lib/repositories/supabase-repositories'
import type { DataMode, Repositories } from '@/lib/repositories/types'
import { createQueryClient } from '@/lib/query/client'
import { queryKeys } from '@/lib/query/keys'

interface DataContextValue {
  mode: DataMode
  repos: Repositories
  coupleId: string | null
}

const DataContext = createContext<DataContextValue | null>(null)

const INVALIDATE_DEBOUNCE_MS = 250

function RemoteDataSync({ coupleId, repos }: { coupleId: string; repos: Repositories }) {
  const queryClient = useQueryClient()
  const invalidateTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const scheduleInvalidate = (key: QueryKey) => {
      const timerKey = JSON.stringify(key)
      const existing = invalidateTimers.current.get(timerKey)
      if (existing) clearTimeout(existing)

      invalidateTimers.current.set(
        timerKey,
        setTimeout(() => {
          invalidateTimers.current.delete(timerKey)
          void queryClient.invalidateQueries({ queryKey: key })
        }, INVALIDATE_DEBOUNCE_MS),
      )
    }

    const unsubs = [
      repos.movements.subscribe(() => scheduleInvalidate(queryKeys.movements(coupleId))),
      repos.categories.subscribe(() => scheduleInvalidate(queryKeys.categories(coupleId))),
      repos.settings.subscribe(() => scheduleInvalidate(queryKeys.settings(coupleId))),
      repos.imports.subscribe(() => {
        scheduleInvalidate(queryKeys.imports(coupleId))
        scheduleInvalidate(['pendingImports', coupleId])
      }),
      repos.budgets.subscribe(() => scheduleInvalidate(queryKeys.budgets(coupleId))),
    ]

    return () => {
      unsubs.forEach((unsub) => unsub())
      for (const timer of invalidateTimers.current.values()) {
        clearTimeout(timer)
      }
      invalidateTimers.current.clear()
    }
  }, [coupleId, repos, queryClient])

  useEffect(() => {
    void Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.settings(coupleId),
        queryFn: () => repos.settings.get(),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.categories(coupleId),
        queryFn: () => repos.categories.list(),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.movements(coupleId),
        queryFn: () => repos.movements.list(),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.budgets(coupleId),
        queryFn: () => repos.budgets.listRecurring(),
      }),
    ])
  }, [coupleId, repos, queryClient])

  return null
}

function DataProviderInner({ children }: { children: ReactNode }) {
  const { configured, membership } = useAuth()
  const coupleId = membership?.coupleId ?? null

  const value = useMemo<DataContextValue>(() => {
    if (configured && coupleId) {
      return {
        mode: 'remote',
        repos: createSupabaseRepositories(coupleId),
        coupleId,
      }
    }
    return {
      mode: 'local',
      repos: createDexieRepositories(),
      coupleId: null,
    }
  }, [configured, coupleId])

  return (
    <DataContext.Provider value={value}>
      {value.mode === 'remote' && value.coupleId ? (
        <RemoteDataSync coupleId={value.coupleId} repos={value.repos} />
      ) : null}
      {children}
    </DataContext.Provider>
  )
}

export function DataProvider({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => createQueryClient(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <DataProviderInner>{children}</DataProviderInner>
    </QueryClientProvider>
  )
}

export function useDataContext() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataContext debe usarse dentro de DataProvider')
  return ctx
}

export function useRepositories(): Repositories {
  return useDataContext().repos
}

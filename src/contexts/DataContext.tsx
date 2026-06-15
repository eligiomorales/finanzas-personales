import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
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

function RemoteDataSync({ coupleId, repos }: { coupleId: string; repos: Repositories }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const invalidate =
      <T extends readonly unknown[]>(key: T) =>
      () => {
        void queryClient.invalidateQueries({ queryKey: key })
      }

    const unsubs = [
      repos.movements.subscribe(invalidate(queryKeys.movements(coupleId))),
      repos.categories.subscribe(invalidate(queryKeys.categories(coupleId))),
      repos.settings.subscribe(invalidate(queryKeys.settings(coupleId))),
      repos.imports.subscribe(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.imports(coupleId) })
        void queryClient.invalidateQueries({ queryKey: ['pendingImports', coupleId] })
      }),
      repos.budgets.subscribe(invalidate(queryKeys.budgets(coupleId))),
    ]

    return () => {
      unsubs.forEach((unsub) => unsub())
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

  const value = useMemo<DataContextValue>(() => {
    if (configured && membership) {
      return {
        mode: 'remote',
        repos: createSupabaseRepositories(membership.coupleId),
        coupleId: membership.coupleId,
      }
    }
    return {
      mode: 'local',
      repos: createDexieRepositories(),
      coupleId: null,
    }
  }, [configured, membership])

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

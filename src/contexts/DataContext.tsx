import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createDexieRepositories } from '@/lib/repositories/dexie-repositories'
import { createSupabaseRepositories } from '@/lib/repositories/supabase-repositories'
import type { DataMode, Repositories } from '@/lib/repositories/types'

interface DataContextValue {
  mode: DataMode
  repos: Repositories
  coupleId: string | null
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
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

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useDataContext() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataContext debe usarse dentro de DataProvider')
  return ctx
}

export function useRepositories(): Repositories {
  return useDataContext().repos
}

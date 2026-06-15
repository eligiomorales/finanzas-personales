import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type LayoutHeaderState = {
  title?: string
  subtitle?: string
  leading?: ReactNode
  toolbar?: ReactNode
}

type HeaderEntry = { id: string; state: LayoutHeaderState }

type LayoutHeaderContextValue = {
  register: (id: string, state: LayoutHeaderState) => void
  unregister: (id: string) => void
  active: LayoutHeaderState
}

const LayoutHeaderContext = createContext<LayoutHeaderContextValue | null>(null)

export function LayoutHeaderProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HeaderEntry[]>([])

  const register = useCallback((id: string, state: LayoutHeaderState) => {
    setEntries((prev) => {
      const index = prev.findIndex((entry) => entry.id === id)
      if (index >= 0) {
        const next = [...prev]
        next[index] = { id, state }
        return next
      }
      return [...prev, { id, state }]
    })
  }, [])

  const unregister = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const active = entries[entries.length - 1]?.state ?? {}

  const value = useMemo(
    () => ({ register, unregister, active }),
    [register, unregister, active],
  )

  return <LayoutHeaderContext.Provider value={value}>{children}</LayoutHeaderContext.Provider>
}

export function useLayoutHeaderContext() {
  const context = useContext(LayoutHeaderContext)
  if (!context) {
    throw new Error('useLayoutHeaderContext must be used within LayoutHeaderProvider')
  }
  return context
}

export function useRegisterLayoutHeader(state: LayoutHeaderState) {
  const id = useId()
  const { register, unregister } = useLayoutHeaderContext()
  const { title, subtitle, leading, toolbar } = state

  useLayoutEffect(() => {
    register(id, { title, subtitle, leading, toolbar })
    return () => unregister(id)
  }, [id, register, unregister, title, subtitle, leading, toolbar])
}

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  getAmountsVisible,
  readAmountsVisible,
  setAmountsVisibleRuntime,
  subscribeAmountsVisibility,
  writeAmountsVisible,
} from '@/lib/amounts-visibility'

interface AmountsVisibilityContextValue {
  visible: boolean
  setVisible: (visible: boolean) => void
  toggle: () => void
}

const AmountsVisibilityContext = createContext<AmountsVisibilityContextValue | null>(null)

export function useAmountsVisible(): boolean {
  return useSyncExternalStore(
    subscribeAmountsVisibility,
    getAmountsVisible,
    readAmountsVisible,
  )
}

export function AmountsVisibilityProvider({ children }: { children: ReactNode }) {
  const [visible, setVisibleState] = useState(() => {
    const stored = readAmountsVisible()
    setAmountsVisibleRuntime(stored)
    return stored
  })

  const setVisible = useCallback((next: boolean) => {
    setVisibleState(next)
    writeAmountsVisible(next)
    setAmountsVisibleRuntime(next)
  }, [])

  const toggle = useCallback(() => {
    setVisibleState((prev) => {
      const next = !prev
      writeAmountsVisible(next)
      setAmountsVisibleRuntime(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      visible,
      setVisible,
      toggle,
    }),
    [visible, setVisible, toggle],
  )

  return (
    <AmountsVisibilityContext.Provider value={value}>{children}</AmountsVisibilityContext.Provider>
  )
}

export function useAmountsVisibility() {
  const ctx = useContext(AmountsVisibilityContext)
  if (!ctx) {
    throw new Error('useAmountsVisibility debe usarse dentro de AmountsVisibilityProvider')
  }
  return ctx
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  readExpenseViewMode,
  writeExpenseViewMode,
  type ExpenseViewMode,
} from '@/lib/expense-view-mode'

interface ExpenseViewContextValue {
  mode: ExpenseViewMode
  setMode: (mode: ExpenseViewMode) => void
  isPersonal: boolean
}

const ExpenseViewContext = createContext<ExpenseViewContextValue | null>(null)

export function ExpenseViewProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ExpenseViewMode>(() => readExpenseViewMode())

  const setMode = useCallback((next: ExpenseViewMode) => {
    setModeState(next)
    writeExpenseViewMode(next)
  }, [])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isPersonal: mode === 'personal',
    }),
    [mode, setMode],
  )

  return <ExpenseViewContext.Provider value={value}>{children}</ExpenseViewContext.Provider>
}

export function useExpenseViewMode() {
  const ctx = useContext(ExpenseViewContext)
  if (!ctx) throw new Error('useExpenseViewMode debe usarse dentro de ExpenseViewProvider')
  return ctx
}

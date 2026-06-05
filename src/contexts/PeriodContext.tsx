import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { PeriodRange } from '@/components/PeriodFilter'
import { readStoredPeriod, writeStoredPeriod } from '@/lib/period-storage'

interface PeriodContextValue {
  period: PeriodRange
  setPeriod: (period: PeriodRange) => void
}

const PeriodContext = createContext<PeriodContextValue | null>(null)

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<PeriodRange>(() => readStoredPeriod())

  const setPeriod = useCallback((next: PeriodRange) => {
    setPeriodState(next)
    writeStoredPeriod(next)
  }, [])

  const value = useMemo(() => ({ period, setPeriod }), [period, setPeriod])

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
}

export function usePeriod() {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error('usePeriod debe usarse dentro de PeriodProvider')
  return ctx
}

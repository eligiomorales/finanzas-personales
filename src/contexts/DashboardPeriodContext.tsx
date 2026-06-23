import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { PeriodRange } from '@/components/PeriodFilter'
import {
  readStoredDashboardPeriod,
  writeStoredDashboardPeriod,
} from '@/lib/dashboard-period-storage'

interface DashboardPeriodContextValue {
  period: PeriodRange
  setPeriod: (period: PeriodRange) => void
}

const DashboardPeriodContext = createContext<DashboardPeriodContextValue | null>(null)

export function DashboardPeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<PeriodRange>(() => readStoredDashboardPeriod())

  const setPeriod = useCallback((next: PeriodRange) => {
    setPeriodState(next)
    writeStoredDashboardPeriod(next)
  }, [])

  return (
    <DashboardPeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </DashboardPeriodContext.Provider>
  )
}

export function useDashboardPeriod() {
  const ctx = useContext(DashboardPeriodContext)
  if (!ctx) throw new Error('useDashboardPeriod debe usarse dentro de DashboardPeriodProvider')
  return ctx
}

/** @deprecated Use useDashboardPeriod — kept for dashboard/balance screens. */
export function usePeriod() {
  return useDashboardPeriod()
}

import { describe, it, expect } from 'vitest'
import { format, subMonths } from 'date-fns'
import { buildMonthlyTrends, buildCumulativeSpendSeries } from '@/lib/monthly-trends'
import type { CurrencyConfig } from '@/lib/currency'
import type { Movement } from '@/types'

const config: CurrencyConfig = { displayCurrency: 'ARS', exchangeRateUsd: 1200 }

const base = (overrides: Partial<Movement>): Movement => ({
  id: '1',
  type: 'expense',
  amount: 100,
  currency: 'ARS',
  date: format(new Date(), 'yyyy-MM-dd'),
  description: 'Test',
  categoryId: 'cat-1',
  paidBy: 'personA',
  sharePersonA: 50,
  sharePersonB: 50,
  isShared: true,
  source: 'manual',
  createdAt: '2025-05-01',
  updatedAt: '2025-05-01',
  ...overrides,
})

describe('buildMonthlyTrends', () => {
  it('sums full amounts in couple view', () => {
    const movement = base({ amount: 100 })
    const months = buildMonthlyTrends([movement], config)
    expect(months.find((m) => m.isCurrent)?.totalExpenses).toBe(100)
  })

  it('uses personal share in personal view', () => {
    const movement = base({ amount: 100, sharePersonA: 70, sharePersonB: 30 })
    const monthsA = buildMonthlyTrends([movement], config, { personalRole: 'personA' })
    const monthsB = buildMonthlyTrends([movement], config, { personalRole: 'personB' })
    expect(monthsA.find((m) => m.isCurrent)?.totalExpenses).toBeCloseTo(70)
    expect(monthsB.find((m) => m.isCurrent)?.totalExpenses).toBeCloseTo(30)
  })
})

describe('buildCumulativeSpendSeries', () => {
  const now = new Date(2026, 5, 15) // 15 Jun 2026

  it('accumulates current-month expenses day by day', () => {
    const ym = format(now, 'yyyy-MM')
    const movements = [
      base({ id: 'a', date: `${ym}-05`, amount: 50 }),
      base({ id: 'b', date: `${ym}-10`, amount: 30 }),
      base({ id: 'c', date: `${ym}-15`, amount: 20 }),
    ]
    const series = buildCumulativeSpendSeries(movements, config, undefined, now)
    expect(series).toHaveLength(30) // full June
    expect(series[4].currentCumulative).toBe(50) // day 5
    expect(series[9].currentCumulative).toBe(80) // day 10
    expect(series[14].currentCumulative).toBe(100) // day 15 (today)
    expect(series[15].currentCumulative).toBeNull() // day 16
  })

  it('baseline averages cumulative curves of prior 3 months', () => {
    const ym = format(now, 'yyyy-MM')
    const prev1 = format(subMonths(now, 1), 'yyyy-MM')
    const prev2 = format(subMonths(now, 2), 'yyyy-MM')
    const movements = [
      base({ id: 'p1', date: `${prev1}-01`, amount: 300 }),
      base({ id: 'p2', date: `${prev2}-10`, amount: 150 }),
      base({ id: 'c', date: `${ym}-01`, amount: 10 }),
    ]
    const series = buildCumulativeSpendSeries(movements, config, undefined, now)
    // day 1: only prev1 spent (300) → avg 100
    expect(series[0].baselineCumulative).toBe(100)
    // day 10: prev1 full (300) + prev2 hits 150 → avg 150
    expect(series[9].baselineCumulative).toBe(150)
    // not a straight line from origin: day 5 still 100, not 100 * 5/10
    expect(series[4].baselineCumulative).toBe(100)
    expect(series[4].baselineCumulative).toBeLessThan(series[9].baselineCumulative)
    // baseline extends through month end; current stops at today (day 15)
    expect(series[29].baselineCumulative).toBe(150)
    expect(series[14].currentCumulative).not.toBeNull()
    expect(series[15].currentCumulative).toBeNull()
  })
})

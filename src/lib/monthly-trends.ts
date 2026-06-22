import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  getDaysInMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { getPersonalExpenseAmount, getPersonalIncomeAmount } from '@/lib/balance'
import { getAmountInView } from '@/lib/currency'
import type { Movement } from '@/types'
import type { CurrencyConfig } from '@/lib/currency'

export interface MonthlyTrend {
  yearMonth: string
  label: string
  totalExpenses: number
  totalIncome: number
  netBalance: number
  isCurrent: boolean
}

export interface BuildMonthlyTrendsOptions {
  personalRole?: 'personA' | 'personB'
}

export interface CumulativeSpendPoint {
  day: number
  currentCumulative: number
  baselineCumulative: number
}

/** Stable ISO range for the last 6 calendar months including current.
 *  ponytail: recomputes on module load (page refresh). Stale if app
 *  stays open across a month boundary — acceptable for MVP. */
export function getLast6MonthsRange(): { from: string; to: string } {
  const now = new Date()
  return {
    from: format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd'),
    to: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export function getTrendExpenseAmount(
  movement: Movement,
  currencyConfig: CurrencyConfig,
  personalRole?: 'personA' | 'personB',
): number {
  if (movement.type !== 'expense') return 0
  const amount = personalRole
    ? getPersonalExpenseAmount(movement, personalRole, currencyConfig)
    : getAmountInView(movement, currencyConfig)
  return amount > 0 ? amount : 0
}

function addMovementToMonth(
  month: MonthlyTrend,
  movement: Movement,
  currencyConfig: CurrencyConfig,
  personalRole?: 'personA' | 'personB',
) {
  if (movement.type === 'expense') {
    const amount = getTrendExpenseAmount(movement, currencyConfig, personalRole)
    if (amount <= 0) return
    month.totalExpenses += amount
    return
  }

  if (movement.type === 'income') {
    const amount = personalRole
      ? getPersonalIncomeAmount(movement, personalRole, currencyConfig)
      : getAmountInView(movement, currencyConfig)
    if (amount <= 0) return
    month.totalIncome += amount
  }
}

export function buildMonthlyTrends(
  movements: Movement[],
  currencyConfig: CurrencyConfig,
  options?: BuildMonthlyTrendsOptions,
): MonthlyTrend[] {
  const personalRole = options?.personalRole

  const now = new Date()
  const currentYearMonth = format(now, 'yyyy-MM')

  const months: MonthlyTrend[] = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i)
    const yearMonth = format(date, 'yyyy-MM')
    return {
      yearMonth,
      label: format(date, 'MMM', { locale: es }),
      totalExpenses: 0,
      totalIncome: 0,
      netBalance: 0,
      isCurrent: yearMonth === currentYearMonth,
    }
  })

  const byMonth = new Map(months.map((m) => [m.yearMonth, m]))

  for (const mv of movements) {
    const ym = mv.date.slice(0, 7)
    const month = byMonth.get(ym)
    if (!month) continue
    addMovementToMonth(month, mv, currencyConfig, personalRole)
  }

  for (const m of months) {
    m.netBalance = m.totalIncome - m.totalExpenses
  }

  return months
}

/** Daily cumulative spend for current month vs. avg daily of prior 3 calendar months. */
export function buildCumulativeSpendSeries(
  movements: Movement[],
  currencyConfig: CurrencyConfig,
  options?: BuildMonthlyTrendsOptions,
  now = new Date(),
): CumulativeSpendPoint[] {
  const personalRole = options?.personalRole
  const currentYm = format(now, 'yyyy-MM')
  const todayDay = now.getDate()

  const dailyExpenses = new Map<number, number>()
  for (const mv of movements) {
    if (!mv.date.startsWith(currentYm)) continue
    const amount = getTrendExpenseAmount(mv, currencyConfig, personalRole)
    if (amount <= 0) continue
    const day = Number.parseInt(mv.date.slice(8, 10), 10)
    dailyExpenses.set(day, (dailyExpenses.get(day) ?? 0) + amount)
  }

  let baselineTotal = 0
  let baselineDays = 0
  for (let i = 1; i <= 3; i++) {
    const monthDate = subMonths(now, i)
    const ym = format(monthDate, 'yyyy-MM')
    baselineDays += getDaysInMonth(monthDate)
    for (const mv of movements) {
      if (!mv.date.startsWith(ym)) continue
      baselineTotal += getTrendExpenseAmount(mv, currencyConfig, personalRole)
    }
  }

  const avgDaily = baselineDays > 0 ? baselineTotal / baselineDays : 0

  let cumulative = 0
  const points: CumulativeSpendPoint[] = []
  for (let day = 1; day <= todayDay; day++) {
    cumulative += dailyExpenses.get(day) ?? 0
    points.push({
      day,
      currentCumulative: cumulative,
      baselineCumulative: avgDaily * day,
    })
  }

  return points
}

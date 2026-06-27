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

export interface CategoryMonthSpend {
  yearMonth: string
  label: string
  amount: number
  isCurrent: boolean
}

export interface CategoryMonthlyTrend {
  categoryId: string
  categoryName: string
  color?: string
  total: number
  months: CategoryMonthSpend[]
}

export interface BuildCategoryMonthlyTrendsInput {
  movements: Movement[]
  currencyConfig: CurrencyConfig
  categories: { id: string; name: string; color?: string }[]
  options?: BuildMonthlyTrendsOptions
}

export interface CumulativeSpendPoint {
  day: number
  /** null after today — line stops mid-chart */
  currentCumulative: number | null
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

function buildMonthSpendSkeleton(now = new Date()): CategoryMonthSpend[] {
  const currentYearMonth = format(now, 'yyyy-MM')
  return Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i)
    const yearMonth = format(date, 'yyyy-MM')
    return {
      yearMonth,
      label: format(date, 'MMM', { locale: es }),
      amount: 0,
      isCurrent: yearMonth === currentYearMonth,
    }
  })
}

/** Expense totals per category across the last 6 calendar months. */
export function buildCategoryMonthlyTrends(
  { movements, currencyConfig, categories, options }: BuildCategoryMonthlyTrendsInput,
  now = new Date(),
): CategoryMonthlyTrend[] {
  const personalRole = options?.personalRole
  const monthSkeleton = buildMonthSpendSkeleton(now)
  const byCategory = new Map<string, CategoryMonthlyTrend>()

  for (const mv of movements) {
    if (mv.type !== 'expense' || !mv.categoryId) continue
    const amount = getTrendExpenseAmount(mv, currencyConfig, personalRole)
    if (amount <= 0) continue

    const ym = mv.date.slice(0, 7)
    const monthIndex = monthSkeleton.findIndex((m) => m.yearMonth === ym)
    if (monthIndex < 0) continue

    let trend = byCategory.get(mv.categoryId)
    if (!trend) {
      const cat = categories.find((c) => c.id === mv.categoryId)
      trend = {
        categoryId: mv.categoryId,
        categoryName: cat?.name ?? 'Sin categoría',
        color: cat?.color,
        total: 0,
        months: monthSkeleton.map((m) => ({ ...m })),
      }
      byCategory.set(mv.categoryId, trend)
    }

    trend.months[monthIndex].amount += amount
    trend.total += amount
  }

  return Array.from(byCategory.values()).sort((a, b) => b.total - a.total)
}

/** Daily cumulative spend for current month vs. avg cumulative curve of prior 3 calendar months. */
export function buildCumulativeSpendSeries(
  movements: Movement[],
  currencyConfig: CurrencyConfig,
  options?: BuildMonthlyTrendsOptions,
  now = new Date(),
): CumulativeSpendPoint[] {
  const personalRole = options?.personalRole
  const currentYm = format(now, 'yyyy-MM')
  const todayDay = now.getDate()
  const daysInMonth = getDaysInMonth(now)

  const currentDaily = dailyExpensesForMonth(movements, currentYm, currencyConfig, personalRole)

  const priorDailies = Array.from({ length: 3 }, (_, i) => {
    const monthDate = subMonths(now, i + 1)
    const ym = format(monthDate, 'yyyy-MM')
    return {
      daysInMonth: getDaysInMonth(monthDate),
      daily: dailyExpensesForMonth(movements, ym, currencyConfig, personalRole),
    }
  })

  let cumulative = 0
  const points: CumulativeSpendPoint[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    if (day <= todayDay) {
      cumulative += currentDaily.get(day) ?? 0
    }
    let baselineSum = 0
    for (const { daysInMonth: priorDays, daily } of priorDailies) {
      baselineSum += cumulativeThroughDay(daily, Math.min(day, priorDays))
    }
    points.push({
      day,
      currentCumulative: day <= todayDay ? cumulative : null,
      baselineCumulative: baselineSum / priorDailies.length,
    })
  }

  return points
}

function dailyExpensesForMonth(
  movements: Movement[],
  ym: string,
  currencyConfig: CurrencyConfig,
  personalRole?: 'personA' | 'personB',
): Map<number, number> {
  const daily = new Map<number, number>()
  for (const mv of movements) {
    if (!mv.date.startsWith(ym)) continue
    const amount = getTrendExpenseAmount(mv, currencyConfig, personalRole)
    if (amount <= 0) continue
    const day = Number.parseInt(mv.date.slice(8, 10), 10)
    daily.set(day, (daily.get(day) ?? 0) + amount)
  }
  return daily
}

function cumulativeThroughDay(daily: Map<number, number>, throughDay: number): number {
  let sum = 0
  for (let d = 1; d <= throughDay; d++) {
    sum += daily.get(d) ?? 0
  }
  return sum
}

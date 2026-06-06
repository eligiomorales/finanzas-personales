import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { convertAmount, getAmountInView, type CurrencyConfig } from '@/lib/currency'
import type { CurrencyCode } from '@/types'
import type {
  BudgetProgressStatus,
  BudgetSummary,
  Category,
  CategoryBudget,
  CategoryBudgetProgress,
  Movement,
} from '@/types'

const NEAR_LIMIT_THRESHOLD = 0.8

/** Fixed budget key: one limit per category, applies every month. */
export const RECURRING_BUDGET_MONTH = 'recurring'

export function getBudgetMonthKey(dateOrIso: string | Date): string {
  const date = typeof dateOrIso === 'string' ? parseISO(dateOrIso) : dateOrIso
  return format(date, 'yyyy-MM')
}

export function getMonthDateRange(yearMonth: string): { from: string; to: string } {
  const fromDate = parseISO(`${yearMonth}-01`)
  return {
    from: format(startOfMonth(fromDate), 'yyyy-MM-dd'),
    to: format(endOfMonth(fromDate), 'yyyy-MM-dd'),
  }
}

export function shiftBudgetMonth(yearMonth: string, deltaMonths: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1 + deltaMonths, 1)
  return format(date, 'yyyy-MM')
}

export function filterSharedBudgetMovements(movements: Movement[]): Movement[] {
  return movements.filter((m) => m.type === 'expense' && m.isShared)
}

export function movementsInMonth(movements: Movement[], yearMonth: string): Movement[] {
  const { from, to } = getMonthDateRange(yearMonth)
  return movements.filter((m) => m.date >= from && m.date <= to)
}

function resolveBudgetStatus(percentUsed: number, budgeted: number): BudgetProgressStatus {
  if (budgeted <= 0) return 'unbudgeted'
  if (percentUsed > 1) return 'over'
  if (percentUsed >= NEAR_LIMIT_THRESHOLD) return 'near'
  return 'ok'
}

function budgetAmountInView(budget: CategoryBudget, config: CurrencyConfig): number {
  return getBudgetAmountInView(budget, config)
}

/** Budget limit expressed in the active display currency (same rule as movements). */
export function getBudgetAmountInView(budget: CategoryBudget, config: CurrencyConfig): number {
  const converted = convertAmount(
    budget.amount,
    budget.currency,
    config.displayCurrency,
    config.exchangeRateUsd,
  )
  return roundAmountForCurrency(converted, config.displayCurrency)
}

/** Round for display/input: ARS as whole pesos, USD to cents. */
export function roundAmountForCurrency(amount: number, currency: CurrencyCode): number {
  if (currency === 'ARS') return Math.round(amount)
  return Math.round(amount * 100) / 100
}

export function calculateSharedExpensesByCategory(
  movements: Movement[],
  config: CurrencyConfig,
): Map<string, number> {
  const totals = new Map<string, number>()
  for (const movement of filterSharedBudgetMovements(movements)) {
    if (!movement.categoryId) continue
    const amount = getAmountInView(movement, config)
    totals.set(movement.categoryId, (totals.get(movement.categoryId) ?? 0) + amount)
  }
  return totals
}

export interface BuildBudgetProgressInput {
  budgets: CategoryBudget[]
  movements: Movement[]
  categories: Category[]
  currencyConfig: CurrencyConfig
  yearMonth: string
}

export function buildBudgetProgress({
  budgets,
  movements,
  categories,
  currencyConfig,
  yearMonth,
}: BuildBudgetProgressInput): BudgetSummary {
  const monthMovements = movementsInMonth(movements, yearMonth)
  const spentByCategory = calculateSharedExpensesByCategory(monthMovements, currencyConfig)
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const budgetByCategory = new Map(budgets.map((b) => [b.categoryId, b]))

  const categoryIds = new Set<string>(budgets.map((b) => b.categoryId))

  const categoriesProgress: CategoryBudgetProgress[] = []

  for (const categoryId of categoryIds) {
    const category = expenseCategories.find((c) => c.id === categoryId)
    if (!category) continue

    const budget = budgetByCategory.get(categoryId)
    const spent = spentByCategory.get(categoryId) ?? 0
    const budgeted = budget ? budgetAmountInView(budget, currencyConfig) : 0
    const remaining = budgeted > 0 ? budgeted - spent : 0
    const percentUsed = budgeted > 0 ? spent / budgeted : 0

    categoriesProgress.push({
      categoryId,
      categoryName: category.name,
      color: category.color,
      budgeted,
      spent,
      remaining,
      percentUsed,
      status: resolveBudgetStatus(percentUsed, budgeted),
    })
  }

  categoriesProgress.sort((a, b) => {
    if (a.budgeted > 0 && b.budgeted <= 0) return -1
    if (a.budgeted <= 0 && b.budgeted > 0) return 1
    return b.spent - a.spent
  })

  const budgetedCategories = categoriesProgress.filter((c) => c.budgeted > 0)
  const totalBudgeted = budgetedCategories.reduce((sum, c) => sum + c.budgeted, 0)
  const totalSpent = budgetedCategories.reduce((sum, c) => sum + c.spent, 0)

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining: totalBudgeted - totalSpent,
    categories: categoriesProgress,
  }
}

export function budgetStatusLabel(status: BudgetProgressStatus): string {
  switch (status) {
    case 'ok':
      return 'Dentro del límite'
    case 'near':
      return 'Cerca del límite'
    case 'over':
      return 'Excedido'
    default:
      return 'Sin límite'
  }
}

export function budgetStatusColorClass(status: BudgetProgressStatus): string {
  switch (status) {
    case 'near':
      return 'bg-amber-500'
    case 'over':
      return 'bg-red-500'
    case 'ok':
      return 'bg-emerald-500'
    default:
      return 'bg-brand-500'
  }
}

import type { calculateCoupleBalance } from '@/lib/balance'
import { getAmountInView, formatInViewCurrency, type CurrencyConfig } from '@/lib/currency'
import type { BudgetSummary, Movement, PeriodSummary } from '@/types'

type CoupleBalance = ReturnType<typeof calculateCoupleBalance>

export type InsightTone = 'positive' | 'negative' | 'neutral' | 'warning'

export interface DashboardInsight {
  title: string
  description: string
  tone: InsightTone
  /** Overrides the default tone badge (e.g. «Pendiente» for couple balance). */
  badgeLabel?: string
  /** Renders title as prominent currency amount (tabular-nums). */
  titleVariant?: 'amount'
  action?: {
    label: string
    to: string
  }
}

export interface MetricDelta {
  text: string
  tone: 'positive' | 'negative' | 'neutral'
}

export interface PeriodComparison {
  income: MetricDelta | null
  expenses: MetricDelta | null
  netBalance: MetricDelta | null
}

export interface InsightContext {
  movements: Movement[]
  summary: PeriodSummary
  previousSummary: PeriodSummary
  comparison: PeriodComparison
  coupleBalance: CoupleBalance
  budgetSummary?: BudgetSummary | null
  pendingImportCount?: number
  personAName: string
  personBName: string
  currencyConfig: CurrencyConfig
  isPersonal?: boolean
}

type InsightRuleResult = DashboardInsight & { priority: number }
type InsightRule = (ctx: InsightContext) => InsightRuleResult | null

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function formatPercentChange(pct: number): string {
  const rounded = Math.round(pct)
  if (rounded === 0) return 'Sin cambio vs mes ant.'
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded}% vs mes ant.`
}

function deltaTone(
  pct: number,
  favorableWhenHigher: boolean,
): 'positive' | 'negative' | 'neutral' {
  if (Math.abs(pct) < 1) return 'neutral'
  const increased = pct > 0
  const favorable = favorableWhenHigher ? increased : !increased
  return favorable ? 'positive' : 'negative'
}

function buildMetricDelta(
  current: number,
  previous: number,
  favorableWhenHigher: boolean,
): MetricDelta | null {
  if (current === 0 && previous === 0) return null

  const pct = percentChange(current, previous)
  if (pct === null) {
    return { text: 'Sin datos del mes anterior', tone: 'neutral' }
  }

  return {
    text: formatPercentChange(pct),
    tone: deltaTone(pct, favorableWhenHigher),
  }
}

export function buildPeriodComparison(
  current: PeriodSummary,
  previous: PeriodSummary,
): PeriodComparison {
  return {
    income: buildMetricDelta(current.totalIncome, previous.totalIncome, true),
    expenses: buildMetricDelta(current.totalExpenses, previous.totalExpenses, false),
    netBalance: buildMetricDelta(current.netBalance, previous.netBalance, true),
  }
}

export interface CategoryExpenseWithDelta {
  categoryId: string
  categoryName: string
  color?: string
  total: number
  delta: MetricDelta | null
}

export function buildCategoryExpenseComparison(
  current: PeriodSummary,
  previous: PeriodSummary,
): CategoryExpenseWithDelta[] {
  const previousByCategory = new Map(
    previous.expensesByCategory.map((cat) => [cat.categoryId, cat.total]),
  )

  return current.expensesByCategory.map((cat) => ({
    ...cat,
    delta: buildMetricDelta(cat.total, previousByCategory.get(cat.categoryId) ?? 0, false),
  }))
}

/** Largest |% change| in a category with prior spend; ponytail: O(categories), no ML. */
export function findNotableCategoryExpenseChange(
  current: PeriodSummary,
  previous: PeriodSummary,
  minAbsPercent = 10,
): { categoryName: string; pct: number } | null {
  const previousByCategory = new Map(
    previous.expensesByCategory.map((cat) => [cat.categoryId, cat.total]),
  )

  let best: { categoryName: string; pct: number; absPct: number } | null = null

  for (const cat of current.expensesByCategory) {
    const previousTotal = previousByCategory.get(cat.categoryId) ?? 0
    const pct = percentChange(cat.total, previousTotal)
    if (pct === null) continue
    const rounded = Math.round(pct)
    if (rounded === 0) continue
    const absPct = Math.abs(rounded)
    if (absPct < minAbsPercent) continue
    if (!best || absPct > best.absPct) {
      best = { categoryName: cat.categoryName, pct: rounded, absPct }
    }
  }

  return best ? { categoryName: best.categoryName, pct: best.pct } : null
}

/** ponytail: groups by normalized description; minCount avoids one-off duplicates. */
export function findMerchantConcentration(
  movements: Movement[],
  config: CurrencyConfig,
  minCount = 3,
): { displayName: string; total: number; count: number } | null {
  const groups = new Map<string, { displayName: string; total: number; count: number }>()

  for (const m of movements) {
    if (m.type !== 'expense') continue
    const key = m.description.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!key) continue
    const amount = getAmountInView(m, config)
    const entry = groups.get(key)
    if (entry) {
      entry.total += amount
      entry.count += 1
    } else {
      groups.set(key, { displayName: m.description.trim(), total: amount, count: 1 })
    }
  }

  let best: { displayName: string; total: number; count: number } | null = null
  for (const entry of groups.values()) {
    if (entry.count < minCount) continue
    if (!best || entry.total > best.total) best = entry
  }
  return best
}

function checkNoMovements(ctx: InsightContext): InsightRuleResult | null {
  if (ctx.movements.length > 0) return null
  return {
    priority: 100,
    title: 'Empezá a registrar este mes',
    description:
      'Todavía no hay movimientos. Registrá un gasto o importá un resumen para ver cómo viene el mes.',
    tone: 'neutral',
    action: { label: 'Registrar movimiento', to: '/movimientos/nuevo' },
  }
}

function checkPendingImports(ctx: InsightContext): InsightRuleResult | null {
  const count = ctx.pendingImportCount ?? 0
  if (count <= 0) return null
  return {
    priority: 90,
    title: `${count} movimiento${count === 1 ? '' : 's'} importado${count === 1 ? '' : 's'} por confirmar`,
    description: 'Confirmá o ignorá para que se reflejen en tus totales.',
    tone: 'warning',
    action: { label: 'Revisar importación', to: '/importar' },
  }
}

function checkUncategorized(ctx: InsightContext): InsightRuleResult | null {
  const uncategorized = ctx.movements.filter((m) => m.type === 'expense' && !m.categoryId)
  if (uncategorized.length === 0) return null
  const count = uncategorized.length
  return {
    priority: 80,
    title: `${count} gasto${count === 1 ? '' : 's'} sin categoría`,
    description: 'Categorizalos para que los totales y presupuestos sean precisos.',
    tone: 'warning',
    action: { label: 'Categorizar', to: '/movimientos?q=sin+categoria' },
  }
}

function checkBudgetOverrun(ctx: InsightContext): InsightRuleResult | null {
  if (ctx.isPersonal || !ctx.budgetSummary) return null
  const over = ctx.budgetSummary.categories.filter((c) => c.status === 'over')
  if (over.length === 0) return null
  const top = over[0]
  const pct = Math.round(top.percentUsed * 100)
  return {
    priority: 70,
    title: `${top.categoryName} excedió el presupuesto`,
    description: `Gastaste ${pct}% del presupuesto asignado en esta categoría.`,
    tone: 'negative',
    action: { label: 'Ver presupuesto', to: '/analisis/tendencias' },
  }
}

function checkCoupleBalance(ctx: InsightContext): InsightRuleResult | null {
  const { coupleBalance, personAName, personBName, currencyConfig } = ctx
  if (coupleBalance.owedBy === 'balanced' || coupleBalance.owedAmount <= 0.01) return null
  const debtor = coupleBalance.owedBy === 'personA' ? personAName : personBName
  const creditor = coupleBalance.owedBy === 'personA' ? personBName : personAName
  return {
    priority: 60,
    title: formatInViewCurrency(coupleBalance.owedAmount, currencyConfig),
    description: `${debtor} debe a ${creditor}`,
    tone: 'warning',
    badgeLabel: 'Pendiente',
    titleVariant: 'amount',
    action: { label: 'Ver balance', to: '/balance' },
  }
}

function checkNegativeBalance(ctx: InsightContext): InsightRuleResult | null {
  if (ctx.summary.netBalance >= 0) return null
  return {
    priority: 50,
    title: 'El mes cierra en negativo',
    description:
      'Los gastos superan los ingresos este mes. Revisá tus categorías para ver dónde se concentra el gasto.',
    tone: 'negative',
    action: { label: 'Ver gastos por categoría', to: '/analisis/tendencias' },
  }
}

function checkBudgetNear(ctx: InsightContext): InsightRuleResult | null {
  if (ctx.isPersonal || !ctx.budgetSummary) return null
  const near = ctx.budgetSummary.categories.filter((c) => c.status === 'near')
  if (near.length === 0) return null
  const top = near[0]
  const pct = Math.round(top.percentUsed * 100)
  return {
    priority: 40,
    title: `${top.categoryName} cerca del límite`,
    description: `Llevás ${pct}% del presupuesto asignado en esta categoría.`,
    tone: 'warning',
    action: { label: 'Ver presupuesto', to: '/analisis/tendencias' },
  }
}

function checkMerchantConcentration(ctx: InsightContext): InsightRuleResult | null {
  const merchant = findMerchantConcentration(ctx.movements, ctx.currencyConfig)
  if (!merchant) return null
  const formatted = formatInViewCurrency(merchant.total, ctx.currencyConfig)
  return {
    priority: 35,
    title: `${formatted} en ${merchant.displayName}`,
    description: `${merchant.count} compras en este comercio este mes. Revisá si hay duplicados o gastos recurrentes.`,
    tone: 'neutral',
    action: { label: 'Ver movimientos', to: '/movimientos' },
  }
}

function checkCategorySpike(ctx: InsightContext): InsightRuleResult | null {
  const categoryChange = findNotableCategoryExpenseChange(ctx.summary, ctx.previousSummary)
  if (!categoryChange) return null
  const { categoryName, pct } = categoryChange
  if (pct < 0) {
    return {
      priority: 30,
      title: `${Math.abs(pct)}% menos en ${categoryName}`,
      description: `Gastaste menos que el mes anterior en esta categoría (${formatPercentChange(pct)}).`,
      tone: 'positive',
      action: { label: 'Ver categorías', to: '/analisis/tendencias' },
    }
  }
  return {
    priority: 30,
    title: `${pct}% más en ${categoryName}`,
    description: `Este rubro subió respecto al mes anterior (${formatPercentChange(pct)}).`,
    tone: 'warning',
    action: { label: 'Ver categorías', to: '/analisis/tendencias' },
  }
}

function checkExpensesIncreased(ctx: InsightContext): InsightRuleResult | null {
  const expenseDelta = ctx.comparison.expenses
  if (expenseDelta?.tone !== 'negative' || !expenseDelta.text.includes('%')) return null
  return {
    priority: 20,
    title: 'Tus gastos subieron respecto al mes anterior',
    description: `${expenseDelta.text}. Revisá la categoría que más peso tiene este mes.`,
    tone: 'warning',
    action: { label: 'Ver categorías', to: '/analisis/tendencias' },
  }
}

function checkTopCategory(ctx: InsightContext): InsightRuleResult | null {
  const topCategory = ctx.summary.expensesByCategory[0]
  if (!topCategory) return null
  return {
    priority: 10,
    title: 'Tu mayor gasto del mes',
    description: `${topCategory.categoryName} concentra la mayor parte de tus gastos este mes.`,
    tone: 'neutral',
    action: { label: 'Ver categorías', to: '/analisis/tendencias' },
  }
}

function checkPositiveMonth(ctx: InsightContext): InsightRuleResult | null {
  if (ctx.summary.netBalance <= 0) return null
  return {
    priority: 5,
    title: 'El mes va bien',
    description: 'Tus ingresos superan los gastos este mes. Seguí registrando para mantener el control.',
    tone: 'positive',
    action: { label: 'Ver movimientos', to: '/movimientos' },
  }
}

function checkBalancedFallback(): InsightRuleResult {
  return {
    priority: 1,
    title: 'Mes equilibrado',
    description: 'Ingresos y gastos están parejos. Revisá el detalle si querés ajustar algo.',
    tone: 'neutral',
    action: { label: 'Ver movimientos', to: '/movimientos' },
  }
}

const INSIGHT_RULES: InsightRule[] = [
  checkNoMovements,
  checkPendingImports,
  checkUncategorized,
  checkBudgetOverrun,
  checkCoupleBalance,
  checkNegativeBalance,
  checkBudgetNear,
  checkMerchantConcentration,
  checkCategorySpike,
  checkExpensesIncreased,
  checkTopCategory,
  checkPositiveMonth,
]

export function buildDashboardInsights(ctx: InsightContext): DashboardInsight[] {
  const matched = INSIGHT_RULES
    .map((rule) => rule(ctx))
    .filter((result): result is InsightRuleResult => result !== null)
    .sort((a, b) => b.priority - a.priority)

  if (matched.length === 0) {
    return [checkBalancedFallback()]
  }

  return matched
}

/** Primary insight for compact surfaces; ponytail: first rule match by priority. */
export function buildDashboardInsight(ctx: InsightContext): DashboardInsight {
  return buildDashboardInsights(ctx)[0]
}

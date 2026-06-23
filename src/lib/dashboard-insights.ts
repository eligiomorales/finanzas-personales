import type { calculateCoupleBalance } from '@/lib/balance'
import type { PeriodSummary } from '@/types'

type CoupleBalance = ReturnType<typeof calculateCoupleBalance>

export type InsightTone = 'positive' | 'negative' | 'neutral' | 'warning'

export interface DashboardInsight {
  title: string
  description: string
  tone: InsightTone
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

export function buildDashboardInsight(params: {
  movementCount: number
  coupleBalance: CoupleBalance
  summary: PeriodSummary
  comparison: PeriodComparison
  personAName: string
  personBName: string
}): DashboardInsight {
  const { movementCount, coupleBalance, summary, comparison, personAName, personBName } = params

  if (movementCount === 0) {
    return {
      title: 'Empezá a registrar este mes',
      description:
        'Todavía no hay movimientos. Registrá un gasto o importá un resumen para ver cómo viene el mes.',
      tone: 'neutral',
      action: { label: 'Registrar movimiento', to: '/movimientos/nuevo' },
    }
  }

  if (coupleBalance.owedBy !== 'balanced' && coupleBalance.owedAmount > 0.01) {
    const debtor = coupleBalance.owedBy === 'personA' ? personAName : personBName
    const creditor = coupleBalance.owedBy === 'personA' ? personBName : personAName
    return {
      title: 'Hay un saldo pendiente entre ustedes',
      description: `${debtor} debe compensar a ${creditor} por gastos compartidos de este mes.`,
      tone: 'warning',
      action: { label: 'Revisar balance', to: '/balance' },
    }
  }

  if (summary.netBalance < 0) {
    return {
      title: 'El mes cierra en negativo',
      description:
        'Los gastos superan los ingresos este mes. Revisá tus categorías para ver dónde se concentra el gasto.',
      tone: 'negative',
      action: { label: 'Ver gastos por categoría', to: '/analisis/tendencias' },
    }
  }

  const expenseDelta = comparison.expenses
  if (expenseDelta?.tone === 'negative' && expenseDelta.text.includes('%')) {
    return {
      title: 'Tus gastos subieron respecto al mes anterior',
      description: `${expenseDelta.text}. Revisá la categoría que más peso tiene este mes.`,
      tone: 'warning',
      action: { label: 'Ver categorías', to: '/analisis/tendencias' },
    }
  }

  const topCategory = summary.expensesByCategory[0]
  if (topCategory) {
    return {
      title: 'Tu mayor gasto del mes',
      description: `${topCategory.categoryName} concentra la mayor parte de tus gastos este mes.`,
      tone: 'neutral',
      action: { label: 'Ver categorías', to: '/analisis/tendencias' },
    }
  }

  if (summary.netBalance > 0) {
    return {
      title: 'El mes va bien',
      description: 'Tus ingresos superan los gastos este mes. Seguí registrando para mantener el control.',
      tone: 'positive',
      action: { label: 'Ver movimientos', to: '/movimientos' },
    }
  }

  return {
    title: 'Mes equilibrado',
    description: 'Ingresos y gastos están parejos. Revisá el detalle si querés ajustar algo.',
    tone: 'neutral',
    action: { label: 'Ver movimientos', to: '/movimientos' },
  }
}

import { describe, it, expect } from 'vitest'
import {
  buildDashboardInsight,
  buildDashboardInsights,
  buildPeriodComparison,
  buildCategoryExpenseComparison,
  findNotableCategoryExpenseChange,
  findMerchantConcentration,
  percentChange,
  type InsightContext,
} from '@/lib/dashboard-insights'
import { calculateCoupleBalance, calculatePeriodSummary } from '@/lib/balance'
import type { CurrencyConfig } from '@/lib/currency'
import type { BudgetSummary } from '@/types'

const config: CurrencyConfig = { displayCurrency: 'ARS', exchangeRateUsd: 1200 }
const categories = [
  { id: 'food', name: 'Supermercado', color: '#22c55e' },
  { id: 'home', name: 'Hogar', color: '#3b82f6' },
]

function baseContext(overrides: Partial<InsightContext> = {}): InsightContext {
  const emptySummary = calculatePeriodSummary([], categories, config)
  return {
    movements: [],
    coupleBalance: calculateCoupleBalance([], config),
    summary: emptySummary,
    previousSummary: emptySummary,
    comparison: buildPeriodComparison(emptySummary, emptySummary),
    personAName: 'Ana',
    personBName: 'Juan',
    currencyConfig: config,
    ...overrides,
  }
}

describe('percentChange', () => {
  it('returns null when previous is zero', () => {
    expect(percentChange(100, 0)).toBeNull()
  })

  it('calculates increase', () => {
    expect(percentChange(120, 100)).toBe(20)
  })
})

describe('buildPeriodComparison', () => {
  it('marks expense increases as negative tone', () => {
    const current = calculatePeriodSummary(
      [
        {
          id: '1',
          type: 'expense',
          amount: 120,
          currency: 'ARS',
          date: '2026-05-10',
          description: 'Compra',
          categoryId: 'food',
          paidBy: 'personA',
          sharePersonA: 100,
          sharePersonB: 0,
          isShared: false,
          source: 'manual',
          createdAt: '2026-05-10',
          updatedAt: '2026-05-10',
        },
      ],
      categories,
      config,
    )
    const previous = calculatePeriodSummary(
      [
        {
          id: '2',
          type: 'expense',
          amount: 100,
          currency: 'ARS',
          date: '2026-04-10',
          description: 'Compra',
          categoryId: 'food',
          paidBy: 'personA',
          sharePersonA: 100,
          sharePersonB: 0,
          isShared: false,
          source: 'manual',
          createdAt: '2026-04-10',
          updatedAt: '2026-04-10',
        },
      ],
      categories,
      config,
    )

    const comparison = buildPeriodComparison(current, previous)
    expect(comparison.expenses?.text).toBe('+20% vs mes ant.')
    expect(comparison.expenses?.tone).toBe('negative')
  })
})

describe('buildCategoryExpenseComparison', () => {
  it('adds per-category deltas vs previous period', () => {
    const expense = {
      id: '1',
      type: 'expense' as const,
      amount: 150,
      currency: 'ARS' as const,
      date: '2026-05-10',
      description: 'Compra',
      categoryId: 'food',
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'manual' as const,
      createdAt: '2026-05-10',
      updatedAt: '2026-05-10',
    }
    const previousExpense = { ...expense, id: '2', amount: 100, date: '2026-04-10' }

    const current = calculatePeriodSummary([expense], categories, config)
    const previous = calculatePeriodSummary([previousExpense], categories, config)
    const result = buildCategoryExpenseComparison(current, previous)

    expect(result).toHaveLength(1)
    expect(result[0].delta?.text).toBe('+50% vs mes ant.')
    expect(result[0].delta?.tone).toBe('negative')
  })
})

describe('findNotableCategoryExpenseChange', () => {
  it('returns largest category shift when above threshold', () => {
    const expense = {
      id: '1',
      type: 'expense' as const,
      amount: 75,
      currency: 'ARS' as const,
      date: '2026-05-10',
      description: 'Compra',
      categoryId: 'food',
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'manual' as const,
      createdAt: '2026-05-10',
      updatedAt: '2026-05-10',
    }
    const previousExpense = { ...expense, id: '2', amount: 100, date: '2026-04-10' }

    const current = calculatePeriodSummary([expense], categories, config)
    const previous = calculatePeriodSummary([previousExpense], categories, config)
    const change = findNotableCategoryExpenseChange(current, previous)

    expect(change).toEqual({ categoryName: 'Supermercado', pct: -25 })
  })
})

describe('findMerchantConcentration', () => {
  it('returns merchant with most spend when min purchases met', () => {
    const movements = [
      {
        id: '1',
        type: 'expense' as const,
        amount: 100,
        currency: 'ARS' as const,
        date: '2026-05-01',
        description: 'Mercado Libre',
        categoryId: 'food',
        paidBy: 'personA' as const,
        sharePersonA: 100,
        sharePersonB: 0,
        isShared: false,
        source: 'imported' as const,
        createdAt: '2026-05-01',
        updatedAt: '2026-05-01',
      },
      {
        id: '2',
        type: 'expense' as const,
        amount: 50,
        currency: 'ARS' as const,
        date: '2026-05-05',
        description: 'mercado libre',
        categoryId: 'food',
        paidBy: 'personA' as const,
        sharePersonA: 100,
        sharePersonB: 0,
        isShared: false,
        source: 'imported' as const,
        createdAt: '2026-05-05',
        updatedAt: '2026-05-05',
      },
      {
        id: '3',
        type: 'expense' as const,
        amount: 30,
        currency: 'ARS' as const,
        date: '2026-05-10',
        description: 'Mercado Libre',
        categoryId: 'food',
        paidBy: 'personA' as const,
        sharePersonA: 100,
        sharePersonB: 0,
        isShared: false,
        source: 'imported' as const,
        createdAt: '2026-05-10',
        updatedAt: '2026-05-10',
      },
    ]

    const result = findMerchantConcentration(movements, config)
    expect(result).toEqual({
      displayName: 'Mercado Libre',
      total: 180,
      count: 3,
    })
  })
})

describe('buildDashboardInsight', () => {
  it('prioritizes empty month onboarding', () => {
    const insight = buildDashboardInsight(baseContext())

    expect(insight.title).toContain('Empezá')
    expect(insight.action?.to).toBe('/movimientos/nuevo')
  })

  it('prioritizes pending imports over couple balance', () => {
    const sharedExpense = {
      id: '1',
      type: 'expense' as const,
      amount: 100,
      currency: 'ARS' as const,
      date: '2026-05-10',
      description: 'Cena',
      categoryId: 'food',
      paidBy: 'personA' as const,
      sharePersonA: 50,
      sharePersonB: 50,
      isShared: true,
      source: 'manual' as const,
      createdAt: '2026-05-10',
      updatedAt: '2026-05-10',
    }
    const summary = calculatePeriodSummary([sharedExpense], categories, config)

    const insight = buildDashboardInsight(
      baseContext({
        movements: [sharedExpense],
        coupleBalance: calculateCoupleBalance([sharedExpense], config),
        summary,
        comparison: buildPeriodComparison(summary, calculatePeriodSummary([], categories, config)),
        pendingImportCount: 2,
      }),
    )

    expect(insight.title).toContain('importado')
    expect(insight.action?.to).toBe('/importar')
  })

  it('prioritizes uncategorized expenses', () => {
    const uncategorized = {
      id: '1',
      type: 'expense' as const,
      amount: 80,
      currency: 'ARS' as const,
      date: '2026-05-10',
      description: 'Compra importada',
      categoryId: null,
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'imported' as const,
      createdAt: '2026-05-10',
      updatedAt: '2026-05-10',
    }
    const summary = calculatePeriodSummary([uncategorized], categories, config)

    const insight = buildDashboardInsight(
      baseContext({
        movements: [uncategorized],
        summary,
        comparison: buildPeriodComparison(summary, calculatePeriodSummary([], categories, config)),
      }),
    )

    expect(insight.title).toContain('sin categoría')
    expect(insight.action?.to).toBe('/movimientos?q=sin+categoria')
  })

  it('warns when budget is over', () => {
    const expense = {
      id: '1',
      type: 'expense' as const,
      amount: 1200,
      currency: 'ARS' as const,
      date: '2026-05-10',
      description: 'Compra',
      categoryId: 'food',
      paidBy: 'personA' as const,
      sharePersonA: 50,
      sharePersonB: 50,
      isShared: true,
      source: 'manual' as const,
      createdAt: '2026-05-10',
      updatedAt: '2026-05-10',
    }
    const income = {
      id: '2',
      type: 'income' as const,
      amount: 5000,
      currency: 'ARS' as const,
      date: '2026-05-01',
      description: 'Sueldo',
      categoryId: null,
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'manual' as const,
      createdAt: '2026-05-01',
      updatedAt: '2026-05-01',
    }
    const summary = calculatePeriodSummary([expense, income], categories, config)
    const budgetSummary: BudgetSummary = {
      totalBudgeted: 1000,
      totalSpent: 1200,
      totalRemaining: -200,
      categories: [
        {
          categoryId: 'food',
          categoryName: 'Supermercado',
          color: '#22c55e',
          budgeted: 1000,
          spent: 1200,
          remaining: -200,
          percentUsed: 1.2,
          status: 'over',
        },
      ],
    }

    const insight = buildDashboardInsight(
      baseContext({
        movements: [expense, income],
        summary,
        comparison: buildPeriodComparison(summary, calculatePeriodSummary([], categories, config)),
        budgetSummary,
      }),
    )

    expect(insight.title).toContain('excedió el presupuesto')
    expect(insight.title).toContain('Supermercado')
  })

  it('highlights pending couple balance', () => {
    const movements = [
      {
        id: '1',
        type: 'expense' as const,
        amount: 100,
        currency: 'ARS' as const,
        date: '2026-05-10',
        description: 'Cena',
        categoryId: 'food',
        paidBy: 'personA' as const,
        sharePersonA: 50,
        sharePersonB: 50,
        isShared: true,
        source: 'manual' as const,
        createdAt: '2026-05-10',
        updatedAt: '2026-05-10',
      },
    ]

    const summary = calculatePeriodSummary(movements, categories, config)
    const insight = buildDashboardInsight(
      baseContext({
        movements,
        coupleBalance: calculateCoupleBalance(movements, config),
        summary,
        comparison: buildPeriodComparison(summary, calculatePeriodSummary([], categories, config)),
      }),
    )

    expect(insight.titleVariant).toBe('amount')
    expect(insight.title).toMatch(/50/)
    expect(insight.description).toBe('Juan debe a Ana')
    expect(insight.badgeLabel).toBe('Pendiente')
    expect(insight.action?.to).toBe('/balance')
    expect(insight.action?.label).toBe('Ver balance')
  })

  it('does not warn when historical balance is settled even if current month has activity', () => {
    const sharedExpense = {
      id: '1',
      type: 'expense' as const,
      amount: 100,
      currency: 'ARS' as const,
      date: '2026-06-01',
      description: 'Cena',
      categoryId: 'food',
      paidBy: 'personA' as const,
      sharePersonA: 50,
      sharePersonB: 50,
      isShared: true,
      source: 'manual' as const,
      createdAt: '2026-06-01',
      updatedAt: '2026-06-01',
    }
    const settlement = {
      id: '2',
      type: 'settlement' as const,
      amount: 50,
      currency: 'ARS' as const,
      date: '2026-06-15',
      description: 'Liquidación',
      categoryId: null,
      paidBy: 'personB' as const,
      sharePersonA: 0,
      sharePersonB: 0,
      isShared: false,
      source: 'manual' as const,
      createdAt: '2026-06-15',
      updatedAt: '2026-06-15',
    }
    const income = {
      id: '3',
      type: 'income' as const,
      amount: 500,
      currency: 'ARS' as const,
      date: '2026-06-01',
      description: 'Sueldo',
      categoryId: null,
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'manual' as const,
      createdAt: '2026-06-01',
      updatedAt: '2026-06-01',
    }

    const allMovements = [sharedExpense, settlement, income]
    const summary = calculatePeriodSummary(allMovements, categories, config)
    const insight = buildDashboardInsight(
      baseContext({
        movements: allMovements,
        coupleBalance: calculateCoupleBalance(allMovements, config),
        summary,
        comparison: buildPeriodComparison(summary, calculatePeriodSummary([], categories, config)),
      }),
    )

    expect(calculateCoupleBalance(allMovements, config).owedBy).toBe('balanced')
    expect(insight.titleVariant).not.toBe('amount')
    expect(insight.badgeLabel).not.toBe('Pendiente')
  })

  it('shows category decrease vs previous month', () => {
    const expense = {
      id: '1',
      type: 'expense' as const,
      amount: 75,
      currency: 'ARS' as const,
      date: '2026-05-10',
      description: 'Compra',
      categoryId: 'food',
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'manual' as const,
      createdAt: '2026-05-10',
      updatedAt: '2026-05-10',
    }
    const previousExpense = { ...expense, id: '2', amount: 100, date: '2026-04-10' }
    const income = {
      id: '3',
      type: 'income' as const,
      amount: 500,
      currency: 'ARS' as const,
      date: '2026-05-01',
      description: 'Sueldo',
      categoryId: null,
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'manual' as const,
      createdAt: '2026-05-01',
      updatedAt: '2026-05-01',
    }

    const summary = calculatePeriodSummary([expense, income], categories, config)
    const previousSummary = calculatePeriodSummary([previousExpense, income], categories, config)

    const insight = buildDashboardInsight(
      baseContext({
        movements: [expense, income],
        coupleBalance: calculateCoupleBalance([expense, income], config),
        summary,
        previousSummary,
        comparison: buildPeriodComparison(summary, previousSummary),
      }),
    )

    expect(insight.title).toBe('25% menos en Supermercado')
    expect(insight.tone).toBe('positive')
    expect(insight.action?.to).toBe('/analisis/tendencias')
  })

  it('shows top category when month is balanced without notable shifts', () => {
    const movements = [
      {
        id: '1',
        type: 'expense' as const,
        amount: 200,
        currency: 'ARS' as const,
        date: '2026-05-10',
        description: 'Compra',
        categoryId: 'food',
        paidBy: 'personA' as const,
        sharePersonA: 100,
        sharePersonB: 0,
        isShared: false,
        source: 'manual' as const,
        createdAt: '2026-05-10',
        updatedAt: '2026-05-10',
      },
      {
        id: '2',
        type: 'income' as const,
        amount: 500,
        currency: 'ARS' as const,
        date: '2026-05-01',
        description: 'Sueldo',
        categoryId: null,
        paidBy: 'personA' as const,
        sharePersonA: 100,
        sharePersonB: 0,
        isShared: false,
        source: 'manual' as const,
        createdAt: '2026-05-01',
        updatedAt: '2026-05-01',
      },
    ]

    const summary = calculatePeriodSummary(movements, categories, config)
    const insight = buildDashboardInsight(
      baseContext({
        movements,
        coupleBalance: calculateCoupleBalance(movements, config),
        summary,
        comparison: buildPeriodComparison(summary, calculatePeriodSummary([], categories, config)),
      }),
    )

    expect(insight.title).toContain('mayor gasto')
    expect(insight.description).toContain('Supermercado')
    expect(insight.action?.to).toBe('/analisis/tendencias')
  })
})

describe('buildDashboardInsights', () => {
  it('returns multiple insights sorted by priority', () => {
    const uncategorized = {
      id: '1',
      type: 'expense' as const,
      amount: 80,
      currency: 'ARS' as const,
      date: '2026-05-10',
      description: 'Sin cat',
      categoryId: null,
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'imported' as const,
      createdAt: '2026-05-10',
      updatedAt: '2026-05-10',
    }
    const categorized = {
      id: '2',
      type: 'expense' as const,
      amount: 200,
      currency: 'ARS' as const,
      date: '2026-05-11',
      description: 'Compra',
      categoryId: 'food',
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'manual' as const,
      createdAt: '2026-05-11',
      updatedAt: '2026-05-11',
    }
    const income = {
      id: '3',
      type: 'income' as const,
      amount: 500,
      currency: 'ARS' as const,
      date: '2026-05-01',
      description: 'Sueldo',
      categoryId: null,
      paidBy: 'personA' as const,
      sharePersonA: 100,
      sharePersonB: 0,
      isShared: false,
      source: 'manual' as const,
      createdAt: '2026-05-01',
      updatedAt: '2026-05-01',
    }
    const movements = [uncategorized, categorized, income]
    const summary = calculatePeriodSummary(movements, categories, config)

    const insights = buildDashboardInsights(
      baseContext({
        movements,
        summary,
        comparison: buildPeriodComparison(summary, calculatePeriodSummary([], categories, config)),
        pendingImportCount: 1,
      }),
    )

    expect(insights.length).toBeGreaterThan(1)
    expect(insights[0].title).toContain('importado')
    expect(insights.some((i) => i.title.includes('sin categoría'))).toBe(true)
  })
})

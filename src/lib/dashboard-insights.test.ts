import { describe, it, expect } from 'vitest'
import {
  buildDashboardInsight,
  buildPeriodComparison,
  buildCategoryExpenseComparison,
  percentChange,
} from '@/lib/dashboard-insights'
import { calculateCoupleBalance, calculatePeriodSummary } from '@/lib/balance'
import type { CurrencyConfig } from '@/lib/currency'

const config: CurrencyConfig = { displayCurrency: 'ARS', exchangeRateUsd: 1200 }
const categories = [
  { id: 'food', name: 'Supermercado', color: '#22c55e' },
  { id: 'home', name: 'Hogar', color: '#3b82f6' },
]

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

describe('buildDashboardInsight', () => {
  it('prioritizes empty month onboarding', () => {
    const insight = buildDashboardInsight({
      movementCount: 0,
      coupleBalance: calculateCoupleBalance([], config),
      summary: calculatePeriodSummary([], categories, config),
      comparison: buildPeriodComparison(
        calculatePeriodSummary([], categories, config),
        calculatePeriodSummary([], categories, config),
      ),
      personAName: 'Ana',
      personBName: 'Juan',
    })

    expect(insight.title).toContain('Empezá')
    expect(insight.action?.to).toBe('/movimientos/nuevo')
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

    const insight = buildDashboardInsight({
      movementCount: movements.length,
      coupleBalance: calculateCoupleBalance(movements, config),
      summary: calculatePeriodSummary(movements, categories, config),
      comparison: buildPeriodComparison(
        calculatePeriodSummary(movements, categories, config),
        calculatePeriodSummary([], categories, config),
      ),
      personAName: 'Ana',
      personBName: 'Juan',
    })

    expect(insight.title).toContain('saldo pendiente')
    expect(insight.action?.to).toBe('/balance')
  })

  it('shows top category when month is balanced', () => {
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

    const insight = buildDashboardInsight({
      movementCount: movements.length,
      coupleBalance: calculateCoupleBalance(movements, config),
      summary: calculatePeriodSummary(movements, categories, config),
      comparison: buildPeriodComparison(
        calculatePeriodSummary(movements, categories, config),
        calculatePeriodSummary([], categories, config),
      ),
      personAName: 'Ana',
      personBName: 'Juan',
    })

    expect(insight.title).toContain('mayor gasto')
    expect(insight.description).toContain('Supermercado')
  })
})

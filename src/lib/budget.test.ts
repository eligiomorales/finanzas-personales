import { describe, it, expect } from 'vitest'
import {
  buildBudgetProgress,
  filterSharedBudgetMovements,
  getBudgetAmountInView,
  getBudgetMonthKey,
  getMonthDateRange,
  movementsInMonth,
  roundAmountForCurrency,
  shiftBudgetMonth,
} from '@/lib/budget'
import type { CurrencyConfig } from '@/lib/currency'
import type { Category, CategoryBudget, Movement } from '@/types'

const config: CurrencyConfig = { displayCurrency: 'ARS', exchangeRateUsd: 1200 }

const categories: Category[] = [
  { id: 'cat-food', name: 'Comida', type: 'expense', color: '#f97316' },
  { id: 'cat-transport', name: 'Transporte', type: 'expense' },
  { id: 'cat-income', name: 'Salario', type: 'income' },
]

const baseMovement = (overrides: Partial<Movement>): Movement => ({
  id: '1',
  type: 'expense',
  amount: 100,
  currency: 'ARS',
  date: '2026-06-15',
  description: 'Test',
  categoryId: 'cat-food',
  paidBy: 'personA',
  sharePersonA: 50,
  sharePersonB: 50,
  isShared: true,
  source: 'manual',
  createdAt: '2026-06-15',
  updatedAt: '2026-06-15',
  ...overrides,
})

describe('getBudgetMonthKey', () => {
  it('returns YYYY-MM from ISO date', () => {
    expect(getBudgetMonthKey('2026-06-15')).toBe('2026-06')
  })
})

describe('getMonthDateRange', () => {
  it('returns first and last day of month', () => {
    expect(getMonthDateRange('2026-06')).toEqual({
      from: '2026-06-01',
      to: '2026-06-30',
    })
  })
})

describe('shiftBudgetMonth', () => {
  it('moves to previous month', () => {
    expect(shiftBudgetMonth('2026-06', -1)).toBe('2026-05')
  })

  it('moves to next month', () => {
    expect(shiftBudgetMonth('2026-06', 1)).toBe('2026-07')
  })
})

describe('filterSharedBudgetMovements', () => {
  it('includes shared expenses only', () => {
    const movements = [
      baseMovement({ id: '1', isShared: true }),
      baseMovement({ id: '2', isShared: false }),
      baseMovement({ id: '3', type: 'income', isShared: true }),
    ]
    expect(filterSharedBudgetMovements(movements)).toHaveLength(1)
    expect(filterSharedBudgetMovements(movements)[0].id).toBe('1')
  })
})

describe('movementsInMonth', () => {
  it('includes movements on month boundaries', () => {
    const movements = [
      baseMovement({ id: '1', date: '2026-06-01' }),
      baseMovement({ id: '2', date: '2026-06-30' }),
      baseMovement({ id: '3', date: '2026-05-31' }),
      baseMovement({ id: '4', date: '2026-07-01' }),
    ]
    const result = movementsInMonth(movements, '2026-06')
    expect(result.map((m) => m.id)).toEqual(['1', '2'])
  })
})

describe('getBudgetAmountInView', () => {
  it('converts ARS budget to USD display', () => {
    const budget: CategoryBudget = {
      id: 'b1',
      categoryId: 'cat-food',
      yearMonth: '2026-06',
      amount: 50000,
      currency: 'ARS',
      scope: 'couple',
      createdAt: '2026-06-01',
      updatedAt: '2026-06-01',
    }
    expect(getBudgetAmountInView(budget, { displayCurrency: 'USD', exchangeRateUsd: 1200 })).toBe(
      41.67,
    )
  })

  it('rounds ARS to whole pesos', () => {
    expect(roundAmountForCurrency(1234.6, 'ARS')).toBe(1235)
  })
})

describe('buildBudgetProgress', () => {
  const budgets: CategoryBudget[] = [
    {
      id: 'b1',
      categoryId: 'cat-food',
      yearMonth: '2026-06',
      amount: 1000,
      currency: 'ARS',
      scope: 'couple',
      createdAt: '2026-06-01',
      updatedAt: '2026-06-01',
    },
    {
      id: 'b2',
      categoryId: 'cat-transport',
      yearMonth: '2026-06',
      amount: 500,
      currency: 'ARS',
      scope: 'couple',
      createdAt: '2026-06-01',
      updatedAt: '2026-06-01',
    },
  ]

  it('counts only shared expenses toward budget', () => {
    const movements = [
      baseMovement({ id: '1', amount: 400, categoryId: 'cat-food', isShared: true }),
      baseMovement({ id: '2', amount: 200, categoryId: 'cat-food', isShared: false }),
    ]

    const summary = buildBudgetProgress({
      budgets,
      movements,
      categories,
      currencyConfig: config,
      yearMonth: '2026-06',
    })

    const food = summary.categories.find((c) => c.categoryId === 'cat-food')
    expect(food?.spent).toBe(400)
    expect(food?.status).toBe('ok')
  })

  it('converts USD movements using exchange rate', () => {
    const movements = [
      baseMovement({
        id: '1',
        amount: 1,
        currency: 'USD',
        categoryId: 'cat-food',
        isShared: true,
      }),
    ]

    const summary = buildBudgetProgress({
      budgets,
      movements,
      categories,
      currencyConfig: config,
      yearMonth: '2026-06',
    })

    const food = summary.categories.find((c) => c.categoryId === 'cat-food')
    expect(food?.spent).toBe(1200)
  })

  it('marks category as over when spent exceeds budget', () => {
    const movements = [
      baseMovement({ id: '1', amount: 1500, categoryId: 'cat-food', isShared: true }),
    ]

    const summary = buildBudgetProgress({
      budgets,
      movements,
      categories,
      currencyConfig: config,
      yearMonth: '2026-06',
    })

    const food = summary.categories.find((c) => c.categoryId === 'cat-food')
    expect(food?.status).toBe('over')
    expect(food?.percentUsed).toBeGreaterThan(1)
  })

  it('marks category as near when spent is between 80% and 100%', () => {
    const movements = [
      baseMovement({ id: '1', amount: 850, categoryId: 'cat-food', isShared: true }),
    ]

    const summary = buildBudgetProgress({
      budgets,
      movements,
      categories,
      currencyConfig: config,
      yearMonth: '2026-06',
    })

    const food = summary.categories.find((c) => c.categoryId === 'cat-food')
    expect(food?.status).toBe('near')
  })

  it('handles category with budget but no spend', () => {
    const summary = buildBudgetProgress({
      budgets,
      movements: [],
      categories,
      currencyConfig: config,
      yearMonth: '2026-06',
    })

    const transport = summary.categories.find((c) => c.categoryId === 'cat-transport')
    expect(transport?.spent).toBe(0)
    expect(transport?.status).toBe('ok')
    expect(transport?.remaining).toBe(500)
  })

  it('handles category with spend but no budget as unbudgeted', () => {
    const movements = [
      baseMovement({ id: '1', amount: 300, categoryId: 'cat-transport', isShared: true }),
    ]

    const summary = buildBudgetProgress({
      budgets: [budgets[0]],
      movements,
      categories,
      currencyConfig: config,
      yearMonth: '2026-06',
    })

    const transport = summary.categories.find((c) => c.categoryId === 'cat-transport')
    expect(transport?.budgeted).toBe(0)
    expect(transport?.status).toBe('unbudgeted')
    expect(transport?.spent).toBe(300)
  })

  it('computes totals only for budgeted categories', () => {
    const movements = [
      baseMovement({ id: '1', amount: 400, categoryId: 'cat-food', isShared: true }),
      baseMovement({ id: '2', amount: 300, categoryId: 'cat-transport', isShared: true }),
    ]

    const summary = buildBudgetProgress({
      budgets: [budgets[0]],
      movements,
      categories,
      currencyConfig: config,
      yearMonth: '2026-06',
    })

    expect(summary.totalBudgeted).toBe(1000)
    expect(summary.totalSpent).toBe(400)
    expect(summary.totalRemaining).toBe(600)
  })
})

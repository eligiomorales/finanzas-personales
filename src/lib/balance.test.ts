import { describe, it, expect } from 'vitest'
import {
  calculateCoupleBalance,
  calculatePeriodSummary,
  calculatePersonalExpenseSummary,
  getAssumedAmounts,
  getEffectiveShares,
  getPaidAmounts,
  getPersonalExpenseAmount,
  movementVisibleInPersonalView,
  isDuplicateMovement,
  normalizeMovementFormData,
  personalSharesFromPayer,
} from '@/lib/balance'
import type { CurrencyConfig } from '@/lib/currency'
import type { Movement } from '@/types'

const config: CurrencyConfig = { displayCurrency: 'ARS', exchangeRateUsd: 1200 }

const base = (overrides: Partial<Movement>): Movement => ({
  id: '1',
  type: 'expense',
  amount: 100,
  currency: 'ARS',
  date: '2025-05-01',
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

describe('getPaidAmounts', () => {
  it('splits expense paid by personA', () => {
    const result = getPaidAmounts(base({ paidBy: 'personA', amount: 200 }), config)
    expect(result).toEqual({ personA: 200, personB: 0 })
  })

  it('splits expense paid by both equally', () => {
    const result = getPaidAmounts(base({ paidBy: 'both', amount: 100 }), config)
    expect(result).toEqual({ personA: 50, personB: 50 })
  })

  it('converts USD to ARS using global rate', () => {
    const result = getPaidAmounts(
      base({ paidBy: 'personA', amount: 100, currency: 'USD' }),
      config,
    )
    expect(result).toEqual({ personA: 120000, personB: 0 })
  })
})

describe('getAssumedAmounts', () => {
  it('applies 70/30 split', () => {
    const result = getAssumedAmounts(base({ amount: 100, sharePersonA: 70, sharePersonB: 30 }), config)
    expect(result.personA).toBeCloseTo(70)
    expect(result.personB).toBeCloseTo(30)
  })

  it('uses payer-assumes-100% for personal expenses even with stale 50/50 shares', () => {
    const result = getAssumedAmounts(
      base({ amount: 100, paidBy: 'personA', sharePersonA: 50, sharePersonB: 50, isShared: false }),
      config,
    )
    expect(result).toEqual({ personA: 100, personB: 0 })
  })
})

describe('getEffectiveShares', () => {
  it('returns stored shares for shared movements', () => {
    expect(getEffectiveShares(base({ sharePersonA: 70, sharePersonB: 30 }))).toEqual({
      sharePersonA: 70,
      sharePersonB: 30,
    })
  })

  it('derives shares from payer for personal movements', () => {
    expect(getEffectiveShares(base({ paidBy: 'personB', isShared: false }))).toEqual({
      sharePersonA: 0,
      sharePersonB: 100,
    })
  })
})

describe('personalSharesFromPayer', () => {
  it('assigns 100% to the payer', () => {
    expect(personalSharesFromPayer('personA')).toEqual({ sharePersonA: 100, sharePersonB: 0 })
    expect(personalSharesFromPayer('personB')).toEqual({ sharePersonA: 0, sharePersonB: 100 })
  })
})

describe('normalizeMovementFormData', () => {
  it('fixes shares when saving a personal movement', () => {
    const normalized = normalizeMovementFormData({
      type: 'expense',
      amount: 50,
      currency: 'ARS',
      date: '2025-05-01',
      description: 'Personal',
      categoryId: 'cat-1',
      paidBy: 'personB',
      sharePersonA: 50,
      sharePersonB: 50,
      isShared: false,
    })
    expect(normalized.sharePersonA).toBe(0)
    expect(normalized.sharePersonB).toBe(100)
  })
})

describe('calculateCoupleBalance', () => {
  it('calculates who owes whom with 50/50 shared expense paid by one person', () => {
    const movements = [
      base({ amount: 100, paidBy: 'personA', sharePersonA: 50, sharePersonB: 50 }),
    ]
    const balance = calculateCoupleBalance(movements, config)
    expect(balance.personA.paid).toBe(100)
    expect(balance.personA.assumed).toBe(50)
    expect(balance.personB.paid).toBe(0)
    expect(balance.personB.assumed).toBe(50)
    expect(balance.owedBy).toBe('personB')
    expect(balance.owedAmount).toBe(50)
  })

  it('balances out when both pay their share', () => {
    const movements = [
      base({ amount: 100, paidBy: 'personA', sharePersonA: 50, sharePersonB: 50 }),
      base({ id: '2', amount: 100, paidBy: 'personB', sharePersonA: 50, sharePersonB: 50 }),
    ]
    const balance = calculateCoupleBalance(movements, config)
    expect(balance.owedBy).toBe('balanced')
    expect(balance.owedAmount).toBe(0)
  })

  it('applies settlement to reduce debt when debtor is personB', () => {
    const movements = [
      base({ amount: 100, paidBy: 'personA', sharePersonA: 50, sharePersonB: 50 }),
      base({
        id: '2',
        type: 'settlement',
        amount: 50,
        paidBy: 'personB',
        sharePersonA: 0,
        sharePersonB: 0,
        isShared: false,
      }),
    ]
    const balance = calculateCoupleBalance(movements, config)
    expect(balance.owedBy).toBe('balanced')
    expect(balance.owedAmount).toBe(0)
  })

  it('applies settlement to reduce debt when debtor is personA', () => {
    const movements = [
      base({ amount: 100, paidBy: 'personB', sharePersonA: 50, sharePersonB: 50 }),
      base({
        id: '2',
        type: 'settlement',
        amount: 50,
        paidBy: 'personA',
        sharePersonA: 0,
        sharePersonB: 0,
        isShared: false,
      }),
    ]
    const balance = calculateCoupleBalance(movements, config)
    expect(balance.owedBy).toBe('balanced')
    expect(balance.owedAmount).toBe(0)
  })

  it('ignores personal expenses in couple balance', () => {
    const movements = [
      base({
        amount: 15000,
        paidBy: 'personA',
        sharePersonA: 50,
        sharePersonB: 50,
        isShared: false,
      }),
    ]
    const balance = calculateCoupleBalance(movements, config)
    expect(balance.personA.paid).toBe(15000)
    expect(balance.personA.assumed).toBe(15000)
    expect(balance.personB.paid).toBe(0)
    expect(balance.personB.assumed).toBe(0)
    expect(balance.owedBy).toBe('balanced')
  })

  it('ignores income in couple balance', () => {
    const movements = [
      base({ type: 'income', amount: 1000, paidBy: 'personA', sharePersonA: 100, sharePersonB: 0 }),
    ]
    const balance = calculateCoupleBalance(movements, config)
    expect(balance.personA.paid).toBe(0)
    expect(balance.personB.paid).toBe(0)
  })

  it('converts USD expenses using global exchange rate', () => {
    const movements = [
      base({
        amount: 100,
        currency: 'USD',
        paidBy: 'personA',
        sharePersonA: 50,
        sharePersonB: 50,
      }),
    ]
    const balance = calculateCoupleBalance(movements, config)
    expect(balance.personA.paid).toBe(120000)
    expect(balance.personA.assumed).toBe(60000)
    expect(balance.personB.assumed).toBe(60000)
    expect(balance.owedBy).toBe('personB')
    expect(balance.owedAmount).toBe(60000)
  })

  it('balances mixed ARS and USD shared expenses', () => {
    const movements = [
      base({ amount: 60000, currency: 'ARS', paidBy: 'personA' }),
      base({
        id: '2',
        amount: 100,
        currency: 'USD',
        paidBy: 'personB',
      }),
    ]
    const balance = calculateCoupleBalance(movements, config)
    expect(balance.personA.paid).toBe(60000)
    expect(balance.personA.assumed).toBe(90000)
    expect(balance.personB.paid).toBe(120000)
    expect(balance.personB.assumed).toBe(90000)
    expect(balance.owedBy).toBe('personA')
    expect(balance.owedAmount).toBe(30000)
  })

  it('calculates balance in USD when display currency is USD', () => {
    const usdConfig: CurrencyConfig = { displayCurrency: 'USD', exchangeRateUsd: 1200 }
    const movements = [
      base({ amount: 60000, currency: 'ARS', paidBy: 'personA' }),
      base({ id: '2', amount: 100, currency: 'USD', paidBy: 'personB' }),
    ]
    const balance = calculateCoupleBalance(movements, usdConfig)
    expect(balance.personA.paid).toBe(50)
    expect(balance.personA.assumed).toBe(75)
    expect(balance.personB.paid).toBe(100)
    expect(balance.personB.assumed).toBe(75)
    expect(balance.owedBy).toBe('personA')
    expect(balance.owedAmount).toBe(25)
  })
})

describe('getPersonalExpenseAmount', () => {
  it('returns full amount for personal expense paid by the person', () => {
    const movement = base({
      amount: 15000,
      paidBy: 'personA',
      sharePersonA: 50,
      sharePersonB: 50,
      isShared: false,
    })
    expect(getPersonalExpenseAmount(movement, 'personA', config)).toBe(15000)
    expect(getPersonalExpenseAmount(movement, 'personB', config)).toBe(0)
  })

  it('returns only the shared portion for each person', () => {
    const movement = base({ amount: 100, sharePersonA: 50, sharePersonB: 50 })
    expect(getPersonalExpenseAmount(movement, 'personA', config)).toBe(50)
    expect(getPersonalExpenseAmount(movement, 'personB', config)).toBe(50)
  })

  it('returns zero for income and settlement', () => {
    expect(getPersonalExpenseAmount(base({ type: 'income' }), 'personA', config)).toBe(0)
    expect(getPersonalExpenseAmount(base({ type: 'settlement' }), 'personA', config)).toBe(0)
  })
})

describe('movementVisibleInPersonalView', () => {
  it('hides partner personal expenses', () => {
    const movement = base({
      amount: 15000,
      paidBy: 'personB',
      isShared: false,
    })
    expect(movementVisibleInPersonalView(movement, 'personA')).toBe(false)
    expect(movementVisibleInPersonalView(movement, 'personB')).toBe(true)
  })

  it('shows shared expenses for both', () => {
    const movement = base({ amount: 100, sharePersonA: 50, sharePersonB: 50 })
    expect(movementVisibleInPersonalView(movement, 'personA')).toBe(true)
    expect(movementVisibleInPersonalView(movement, 'personB')).toBe(true)
  })
})

describe('calculatePersonalExpenseSummary', () => {
  const categories = [
    { id: 'cat-1', name: 'Salario' },
    { id: 'cat-3', name: 'Super' },
  ]

  it('counts personal expense fully for the payer only', () => {
    const movements = [
      base({
        amount: 15000,
        paidBy: 'personA',
        sharePersonA: 50,
        sharePersonB: 50,
        isShared: false,
        categoryId: 'cat-3',
      }),
    ]
    const summaryA = calculatePersonalExpenseSummary(movements, categories, config, 'personA')
    const summaryB = calculatePersonalExpenseSummary(movements, categories, config, 'personB')
    expect(summaryA.totalExpenses).toBe(15000)
    expect(summaryB.totalExpenses).toBe(0)
  })

  it('splits shared expenses by percentage', () => {
    const movements = [
      base({ amount: 100, sharePersonA: 50, sharePersonB: 50, categoryId: 'cat-3' }),
    ]
    const summaryA = calculatePersonalExpenseSummary(movements, categories, config, 'personA')
    const summaryB = calculatePersonalExpenseSummary(movements, categories, config, 'personB')
    expect(summaryA.totalExpenses).toBe(50)
    expect(summaryB.totalExpenses).toBe(50)
  })

  it('respects custom split ratios', () => {
    const movements = [
      base({ amount: 100, sharePersonA: 70, sharePersonB: 30, categoryId: 'cat-3' }),
    ]
    const summaryA = calculatePersonalExpenseSummary(movements, categories, config, 'personA')
    const summaryB = calculatePersonalExpenseSummary(movements, categories, config, 'personB')
    expect(summaryA.totalExpenses).toBeCloseTo(70)
    expect(summaryB.totalExpenses).toBeCloseTo(30)
  })

  it('ignores settlements and sums personal income', () => {
    const movements = [
      base({ type: 'income', amount: 1000, paidBy: 'personA', categoryId: 'cat-1' }),
      base({ id: '2', type: 'settlement', amount: 50, categoryId: null }),
      base({ id: '3', amount: 200, categoryId: 'cat-3' }),
    ]
    const summary = calculatePersonalExpenseSummary(movements, categories, config, 'personA')
    expect(summary.totalIncome).toBe(1000)
    expect(summary.totalExpenses).toBe(100)
  })

  it('converts USD amounts using global rate', () => {
    const movements = [
      base({ amount: 100, currency: 'USD', sharePersonA: 50, sharePersonB: 50, categoryId: 'cat-3' }),
    ]
    const summary = calculatePersonalExpenseSummary(movements, categories, config, 'personA')
    expect(summary.totalExpenses).toBe(60000)
  })

  it('groups expenses by category', () => {
    const movements = [
      base({ amount: 300, categoryId: 'cat-3' }),
      base({ id: '2', amount: 200, categoryId: 'cat-3' }),
    ]
    const summary = calculatePersonalExpenseSummary(movements, categories, config, 'personA')
    expect(summary.expensesByCategory).toHaveLength(1)
    expect(summary.expensesByCategory[0].total).toBe(250)
  })
})

describe('calculatePeriodSummary', () => {
  it('sums income and expenses', () => {
    const movements = [
      base({ type: 'income', amount: 1000, categoryId: 'cat-1' }),
      base({ id: '2', type: 'expense', amount: 300, categoryId: 'cat-3' }),
      base({ id: '3', type: 'expense', amount: 200, categoryId: 'cat-3' }),
    ]
    const summary = calculatePeriodSummary(
      movements,
      [
        { id: 'cat-1', name: 'Salario' },
        { id: 'cat-3', name: 'Super' },
      ],
      config,
    )
    expect(summary.totalIncome).toBe(1000)
    expect(summary.totalExpenses).toBe(500)
    expect(summary.netBalance).toBe(500)
    expect(summary.expensesByCategory[0].total).toBe(500)
  })

  it('converts USD amounts using global rate', () => {
    const movements = [
      base({ type: 'income', amount: 100, currency: 'USD', categoryId: 'cat-1' }),
      base({ id: '2', type: 'expense', amount: 50, currency: 'USD', categoryId: 'cat-3' }),
    ]
    const summary = calculatePeriodSummary(
      movements,
      [
        { id: 'cat-1', name: 'Salario' },
        { id: 'cat-3', name: 'Super' },
      ],
      config,
    )
    expect(summary.totalIncome).toBe(120000)
    expect(summary.totalExpenses).toBe(60000)
    expect(summary.netBalance).toBe(60000)
  })
})

describe('isDuplicateMovement', () => {
  it('detects duplicate by date, amount and description', () => {
    const existing = base({ description: 'Supermercado Coto', amount: 45000, date: '2025-05-12' })
    expect(
      isDuplicateMovement(existing, {
        date: '2025-05-12',
        amount: 45000,
        description: 'Supermercado Coto',
      }),
    ).toBe(true)
  })

  it('does not flag different amounts', () => {
    const existing = base({ amount: 100 })
    expect(isDuplicateMovement(existing, { date: '2025-05-01', amount: 200, description: 'Test' })).toBe(
      false,
    )
  })
})

import { describe, expect, it } from 'vitest'
import type { Movement } from '@/types'
import {
  getDefaultCategoryId,
  getFrequentCategoryIds,
  parseAmountInput,
  repartoSummary,
} from '@/lib/movement-form-defaults'

const baseMovement = (overrides: Partial<Movement>): Movement => ({
  id: '1',
  type: 'expense',
  amount: 100,
  currency: 'ARS',
  date: '2026-06-01',
  description: 'Test',
  categoryId: 'cat-1',
  paidBy: 'personA',
  sharePersonA: 50,
  sharePersonB: 50,
  isShared: true,
  source: 'manual',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  ...overrides,
})

describe('parseAmountInput', () => {
  it('parses plain numbers and locale separators', () => {
    expect(parseAmountInput('15000')).toBe(15000)
    expect(parseAmountInput('15.000')).toBe(15000)
    expect(parseAmountInput('15,5')).toBe(15.5)
    expect(parseAmountInput('')).toBe(0)
  })
})

describe('getFrequentCategoryIds', () => {
  it('returns categories ordered by usage frequency', () => {
    const movements = [
      baseMovement({ id: '1', categoryId: 'cat-a', date: '2026-06-03' }),
      baseMovement({ id: '2', categoryId: 'cat-b', date: '2026-06-02' }),
      baseMovement({ id: '3', categoryId: 'cat-a', date: '2026-06-01' }),
      baseMovement({ id: '4', categoryId: 'cat-a', date: '2026-05-30' }),
      baseMovement({ id: '5', type: 'income', categoryId: 'cat-income', date: '2026-05-29' }),
    ]

    expect(getFrequentCategoryIds(movements, 'expense', 3)).toEqual(['cat-a', 'cat-b'])
    expect(getDefaultCategoryId(movements, 'expense')).toBe('cat-a')
    expect(getDefaultCategoryId(movements, 'income')).toBe('cat-income')
  })
})

describe('repartoSummary', () => {
  const labelFor = (role: 'personA' | 'personB') => (role === 'personA' ? 'Carlos' : 'María')

  it('summarizes shared and personal reparto', () => {
    expect(
      repartoSummary(
        {
          type: 'expense',
          paidBy: 'personA',
          isShared: true,
          sharePersonA: 50,
          sharePersonB: 50,
        },
        labelFor,
        '50-50',
        [{ value: '50-50', label: '50 / 50' }],
      ),
    ).toBe('Carlos pagó · Compartido 50 / 50')

    expect(
      repartoSummary(
        {
          type: 'expense',
          paidBy: 'personB',
          isShared: false,
          sharePersonA: 0,
          sharePersonB: 100,
        },
        labelFor,
        '100-0',
        [{ value: '100-0', label: '100 / 0' }],
      ),
    ).toBe('María pagó · Personal')
  })

  it('summarizes income as received by one person', () => {
    expect(
      repartoSummary(
        {
          type: 'income',
          paidBy: 'personA',
          isShared: false,
          sharePersonA: 100,
          sharePersonB: 0,
        },
        labelFor,
        '100-0',
        [{ value: '100-0', label: '100 / 0' }],
      ),
    ).toBe('Carlos lo recibió')
  })
})

import { describe, expect, it } from 'vitest'
import { extractDescriptionTokens, inferRulesFromHistory } from '@/lib/infer-rules'
import type { Category, CategoryRule, Movement } from '@/types'

const categories: Category[] = [
  { id: 'cat-super', name: 'Supermercado', type: 'expense' },
  { id: 'cat-resto', name: 'Restaurantes', type: 'expense' },
  { id: 'cat-salud', name: 'Salud', type: 'expense' },
]

function expenseMovement(
  description: string,
  categoryId: string,
  id: string,
): Movement {
  return {
    id,
    type: 'expense',
    amount: 1000,
    currency: 'ARS',
    date: '2026-06-01',
    description,
    categoryId,
    paidBy: 'personA',
    sharePersonA: 50,
    sharePersonB: 50,
    isShared: true,
    source: 'manual',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  }
}

describe('extractDescriptionTokens', () => {
  it('uses first line and drops stopwords and short tokens', () => {
    expect(extractDescriptionTokens('COMPRA FARMACITY SA\n 4517XXXXXXXXXX73')).toEqual(['farmacity'])
  })

  it('ignores pure numeric tokens', () => {
    expect(extractDescriptionTokens('PAGO 1234 FARMACITY')).toEqual(['farmacity'])
  })
})

describe('inferRulesFromHistory', () => {
  it('suggests keyword when token appears twice with same category', () => {
    const movements = [
      expenseMovement('COMPRA FARMACITY CENTRO', 'cat-super', 'm1'),
      expenseMovement('FARMACITY AV CORRIENTES', 'cat-super', 'm2'),
    ]

    const rules = inferRulesFromHistory(movements, [], categories)

    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatchObject({
      keyword: 'farmacity',
      categoryId: 'cat-super',
      categoryName: 'Supermercado',
      count: 2,
      dominance: 1,
    })
  })

  it('excludes tokens below 80% dominance', () => {
    const movements = [
      expenseMovement('FARMACITY NORTE', 'cat-super', 'm1'),
      expenseMovement('FARMACITY SUR', 'cat-super', 'm2'),
      expenseMovement('FARMACITY OESTE', 'cat-salud', 'm3'),
    ]

    expect(inferRulesFromHistory(movements, [], categories)).toEqual([])
  })

  it('skips tokens below minimum count', () => {
    const movements = [expenseMovement('FARMACITY UNICA', 'cat-super', 'm1')]

    expect(inferRulesFromHistory(movements, [], categories)).toEqual([])
  })

  it('skips keywords already covered by existing rules', () => {
    const movements = [
      expenseMovement('FARMACITY A', 'cat-super', 'm1'),
      expenseMovement('FARMACITY B', 'cat-super', 'm2'),
    ]
    const existing: CategoryRule[] = [
      {
        id: 'rule-1',
        keyword: 'farmacity',
        categoryId: 'cat-super',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ]

    expect(inferRulesFromHistory(movements, existing, categories)).toEqual([])
  })

  it('skips redundant hardcoded keywords for the same category', () => {
    const movements = [
      expenseMovement('COMPRA CARREFOUR', 'cat-super', 'm1'),
      expenseMovement('CARREFOUR EXPRESS', 'cat-super', 'm2'),
    ]

    expect(inferRulesFromHistory(movements, [], categories)).toEqual([])
  })
})

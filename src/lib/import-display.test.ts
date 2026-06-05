import { describe, expect, it } from 'vitest'
import { importItemTitle, filterImportReviewItems, buildImportCategoryButtons, type ImportReviewItem } from '@/lib/import-display'

describe('importItemTitle', () => {
  it('uses merchant when available', () => {
    expect(importItemTitle('COMPRA\nDISCO', 'Mercado Libre SRL')).toBe('Mercado Libre SRL')
  })

  it('summarizes transfer lines', () => {
    expect(
      importItemTitle('TRANSFERENCIA A TERCEROS\nEmilia Noemi Tiberio\n27254641583'),
    ).toBe('Transferencia a Emilia Noemi Tiberio')
  })

  it('uses the second line for generic bank labels', () => {
    expect(importItemTitle('COMPRA DEBITO\nSAN ANTONIO\n4517XXXXXXXXXX73')).toBe('SAN ANTONIO')
  })
})

describe('buildImportCategoryButtons', () => {
  const categories = [
    { id: 'cat-a', name: 'Supermercado', type: 'expense' as const },
    { id: 'cat-b', name: 'Transporte', type: 'expense' as const },
    { id: 'cat-c', name: 'Limpieza', type: 'expense' as const },
    { id: 'cat-d', name: 'Otros', type: 'expense' as const },
  ]

  it('includes frequent, suggested and selected categories', () => {
    const buttons = buildImportCategoryButtons(categories, ['cat-a', 'cat-b'], 'cat-c', 'cat-d')
    expect(buttons.map((category) => category.id)).toEqual(['cat-a', 'cat-b', 'cat-d', 'cat-c'])
  })
})

describe('filterImportReviewItems', () => {
  const items = [
    { id: '1', status: 'pending', possibleDuplicate: false },
    { id: '2', status: 'pending', possibleDuplicate: true },
    { id: '3', status: 'ignored', possibleDuplicate: false },
  ] as ImportReviewItem[]

  it('filters pending, duplicates, ignored and all', () => {
    expect(filterImportReviewItems(items, 'pending')).toHaveLength(2)
    expect(filterImportReviewItems(items, 'duplicates')).toHaveLength(1)
    expect(filterImportReviewItems(items, 'ignored')).toHaveLength(1)
    expect(filterImportReviewItems(items, 'all')).toHaveLength(3)
  })
})

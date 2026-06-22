import { describe, expect, it } from 'vitest'
import {
  importItemTitle,
  filterImportReviewItems,
  buildImportCategoryButtons,
  buildImportPreviewSummary,
  buildImportMerchantGroups,
  applyCategoryToImportMerchantGroup,
  buildImportRuleCandidatesToSave,
  defaultImportRuleKeyword,
  importItemAutoApproved,
  importItemCategoryWasCorrected,
  importItemNeedsReview,
  importMerchantGroupKey,
  importPendingMissingCategory,
  normalizeImportMerchantKey,
  shouldApplyImportBulkAction,
  type ImportReviewItem,
} from '@/lib/import-display'
import type { CategoryRule } from '@/types'

describe('importItemTitle', () => {
  it('uses merchant when available', () => {
    expect(importItemTitle('COMPRA\nDISCO', 'Mercado Libre SRL')).toBe('Mercado Libre SRL')
  })

  it('ignores numeric comprobante as merchant and uses the extract reference', () => {
    expect(
      importItemTitle('WWW.FRAVEGA.COM-SANT C.11/18\nComprobante: 006471', '006471'),
    ).toBe('WWW.FRAVEGA.COM-SANT C.11/18')
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
    { id: '1', status: 'pending', possibleDuplicate: false, confidence: 100, needsReview: false },
    { id: '2', status: 'pending', possibleDuplicate: true, confidence: 0, needsReview: true },
    { id: '3', status: 'ignored', possibleDuplicate: false, confidence: 70, needsReview: true },
  ] as ImportReviewItem[]

  it('filters pending, duplicates, ignored, auto-approved and all', () => {
    expect(filterImportReviewItems(items, 'pending')).toHaveLength(2)
    expect(filterImportReviewItems(items, 'duplicates')).toHaveLength(1)
    expect(filterImportReviewItems(items, 'ignored')).toHaveLength(1)
    expect(filterImportReviewItems(items, 'all')).toHaveLength(3)
    expect(filterImportReviewItems(items, 'needs_review')).toHaveLength(1)
    expect(filterImportReviewItems(items, 'auto_approved')).toHaveLength(1)
  })
})

describe('import exception helpers', () => {
  const autoApproved = {
    id: '1',
    status: 'pending',
    needsReview: false,
  } as ImportReviewItem
  const exception = {
    id: '2',
    status: 'pending',
    needsReview: true,
  } as ImportReviewItem
  const ignored = {
    id: '3',
    status: 'ignored',
    needsReview: true,
  } as ImportReviewItem

  it('classifies auto-approved vs exceptions', () => {
    expect(importItemAutoApproved(autoApproved)).toBe(true)
    expect(importItemAutoApproved(exception)).toBe(false)
    expect(importItemNeedsReview(exception)).toBe(true)
    expect(importItemNeedsReview(autoApproved)).toBe(false)
  })

  it('limits bulk actions to exceptions only', () => {
    expect(shouldApplyImportBulkAction(exception)).toBe(true)
    expect(shouldApplyImportBulkAction(autoApproved)).toBe(false)
    expect(shouldApplyImportBulkAction(ignored)).toBe(false)
  })

  it('finds pending rows without category', () => {
    const items = [
      { id: '1', status: 'pending', selectedCategoryId: 'cat-1' },
      { id: '2', status: 'pending', selectedCategoryId: null },
      { id: '3', status: 'ignored', selectedCategoryId: null },
      { id: '4', status: 'pending', selectedCategoryId: 'cat-2' },
    ] as ImportReviewItem[]

    expect(importPendingMissingCategory(items).map((item) => item.id)).toEqual(['2'])
  })
})

describe('import merchant grouping', () => {
  function reviewItem(
    overrides: Partial<ImportReviewItem> & Pick<ImportReviewItem, 'id'>,
  ): ImportReviewItem {
    return {
      importId: 'imp-1',
      date: '2026-06-01',
      originalDescription: 'STARBUCKS',
      amount: 1000,
      currency: 'ARS',
      suggestedCategoryId: null,
      possibleDuplicate: false,
      status: 'pending',
      selectedCategoryId: null,
      confidence: 70,
      needsReview: true,
      paidBy: 'personA',
      isShared: false,
      sharePersonA: 100,
      sharePersonB: 0,
      splitPreset: 'full_a',
      ...overrides,
    } as ImportReviewItem
  }

  it('normalizes merchant keys without accents and extra spaces', () => {
    expect(normalizeImportMerchantKey('  Café   Martínez  ')).toBe('cafe martinez')
  })

  it('groups by readable title, not numeric comprobante merchant', () => {
    const items = [
      reviewItem({
        id: '1',
        originalDescription: 'WWW.FRAVEGA.COM\nComprobante: 006471',
        merchant: '006471',
      }),
      reviewItem({
        id: '2',
        originalDescription: 'WWW.FRAVEGA.COM-SANT\nComprobante: 006472',
        merchant: '006472',
      }),
    ]

    expect(importMerchantGroupKey(items[0])).toBe('www.fravega.com')
    expect(importMerchantGroupKey(items[1])).toBe('www.fravega.com-sant')
    expect(buildImportMerchantGroups(items, 1200)).toHaveLength(0)
  })

  it('builds groups only for repeated review exceptions', () => {
    const items = [
      reviewItem({ id: '1', originalDescription: 'COMPRA\nSTARBUCKS', amount: 1200 }),
      reviewItem({ id: '2', originalDescription: 'COMPRA\nSTARBUCKS', amount: 800 }),
      reviewItem({ id: '3', originalDescription: 'COMPRA\nSTARBUCKS', amount: 500, needsReview: false }),
      reviewItem({ id: '4', originalDescription: 'COMPRA\nSTARBUCKS', status: 'ignored' }),
      reviewItem({ id: '5', originalDescription: 'RAPPI', amount: 3000 }),
    ]

    const groups = buildImportMerchantGroups(items, 1200)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({
      displayName: 'STARBUCKS',
      count: 2,
      itemIds: ['1', '2'],
      totalArs: 2000,
    })
  })

  it('merges equivalent titles with different casing', () => {
    const items = [
      reviewItem({ id: '1', originalDescription: 'COMPRA\nstarbucks' }),
      reviewItem({ id: '2', originalDescription: 'COMPRA\nSTARBUCKS' }),
    ]

    expect(buildImportMerchantGroups(items, 1200)).toHaveLength(1)
  })

  it('applies category only to items in the target merchant group', () => {
    const items = [
      reviewItem({ id: '1', originalDescription: 'COMPRA\nSTARBUCKS', selectedCategoryId: null }),
      reviewItem({ id: '2', originalDescription: 'COMPRA\nSTARBUCKS', selectedCategoryId: null }),
      reviewItem({ id: '3', originalDescription: 'RAPPI', selectedCategoryId: null }),
    ]
    const groupKey = importMerchantGroupKey(items[0])!

    const updated = applyCategoryToImportMerchantGroup(items, groupKey, 'cat-cafe')
    expect(updated.find((item) => item.id === '1')?.selectedCategoryId).toBe('cat-cafe')
    expect(updated.find((item) => item.id === '2')?.selectedCategoryId).toBe('cat-cafe')
    expect(updated.find((item) => item.id === '3')?.selectedCategoryId).toBeNull()
  })
})

describe('buildImportPreviewSummary', () => {
  const items = [
    {
      id: '1',
      status: 'pending',
      amount: 1000,
      currency: 'ARS',
      confidence: 100,
      needsReview: false,
      possibleDuplicate: false,
    },
    {
      id: '2',
      status: 'pending',
      amount: 500,
      currency: 'ARS',
      confidence: 70,
      needsReview: true,
      possibleDuplicate: false,
    },
    {
      id: '3',
      status: 'ignored',
      amount: 999,
      currency: 'ARS',
      confidence: 0,
      needsReview: true,
      possibleDuplicate: true,
    },
  ] as ImportReviewItem[]

  it('aggregates pending totals, review count, auto-approved and confidence', () => {
    expect(buildImportPreviewSummary(items, 1200, ['OCR warning'])).toEqual({
      expenseCount: 2,
      totalArs: 1500,
      reviewRequiredCount: 1,
      autoApprovedCount: 1,
      aggregateConfidence: 85,
      parserWarnings: ['OCR warning'],
    })
  })
})

describe('import rule candidates', () => {
  function reviewItem(
    overrides: Partial<ImportReviewItem> & Pick<ImportReviewItem, 'id'>,
  ): ImportReviewItem {
    return {
      importId: 'imp-1',
      date: '2026-06-01',
      originalDescription: 'COMPRA\nSTARBUCKS',
      amount: 1000,
      currency: 'ARS',
      suggestedCategoryId: 'cat-otros',
      possibleDuplicate: false,
      status: 'pending',
      selectedCategoryId: 'cat-cafe',
      confidence: 70,
      needsReview: true,
      paidBy: 'personA',
      isShared: false,
      sharePersonA: 100,
      sharePersonB: 0,
      splitPreset: 'full_a',
      ...overrides,
    } as ImportReviewItem
  }

  it('detects corrected categories', () => {
    expect(importItemCategoryWasCorrected(reviewItem({ id: '1' }))).toBe(true)
    expect(
      importItemCategoryWasCorrected(
        reviewItem({ id: '2', selectedCategoryId: 'cat-otros', suggestedCategoryId: 'cat-otros' }),
      ),
    ).toBe(false)
  })

  it('defaults rule keyword from readable title', () => {
    expect(
      defaultImportRuleKeyword({
        originalDescription: 'COMPRA DEBITO\nSAN ANTONIO',
        merchant: undefined,
      }),
    ).toBe('SAN ANTONIO')
  })

  it('builds candidates only for remembered corrected rows', () => {
    const items = [
      reviewItem({ id: '1', selectedCategoryId: 'cat-cafe' }),
      reviewItem({ id: '2', selectedCategoryId: 'cat-cafe', originalDescription: 'RAPPI' }),
      reviewItem({
        id: '3',
        selectedCategoryId: 'cat-otros',
        suggestedCategoryId: 'cat-otros',
      }),
    ]

    expect(
      buildImportRuleCandidatesToSave(items, { '1': 'starbucks', '2': 'rappi' }, []),
    ).toEqual([
      { keyword: 'starbucks', categoryId: 'cat-cafe' },
      { keyword: 'rappi', categoryId: 'cat-cafe' },
    ])
  })

  it('skips existing rules and dedupes normalized keywords', () => {
    const items = [
      reviewItem({ id: '1' }),
      reviewItem({ id: '2', originalDescription: 'COMPRA\nSTARBUCKS CENTRO' }),
    ]
    const existing: CategoryRule[] = [
      {
        id: 'rule-1',
        keyword: 'starbucks',
        categoryId: 'cat-cafe',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ]

    expect(
      buildImportRuleCandidatesToSave(
        items,
        { '1': 'Starbucks', '2': 'STARBUCKS' },
        existing,
      ),
    ).toEqual([])
  })
})

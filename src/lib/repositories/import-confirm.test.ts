import { describe, expect, it } from 'vitest'
import {
  buildConfirmedPendingItems,
  buildImportRecord,
  buildMovementsFromImportItems,
} from '@/lib/repositories/import-confirm'
import type { ConfirmImportInput } from '@/lib/repositories/types'

const baseInput: ConfirmImportInput = {
  id: 'import-1',
  accountType: 'credit',
  fileName: 'resumen.pdf',
  items: [
    {
      id: 'pending-1',
      importId: 'import-1',
      date: '2025-06-01',
      originalDescription: 'Supermercado',
      amount: 1500,
      currency: 'ARS',
      suggestedCategoryId: 'cat-1',
      possibleDuplicate: false,
      status: 'pending',
      selectedCategoryId: 'cat-1',
      paidBy: 'personA',
      isShared: true,
      sharePersonA: 50,
      sharePersonB: 50,
    },
    {
      id: 'pending-2',
      importId: 'import-1',
      date: '2025-06-02',
      originalDescription: 'Duplicado',
      amount: 900,
      currency: 'ARS',
      suggestedCategoryId: null,
      possibleDuplicate: true,
      status: 'ignored',
      selectedCategoryId: null,
      paidBy: 'personB',
      isShared: false,
      sharePersonA: 100,
      sharePersonB: 0,
    },
  ],
}

describe('import confirm helpers', () => {
  it('creates movements only for pending items', () => {
    const now = '2025-06-01T12:00:00.000Z'
    const { movements, confirmedCount } = buildMovementsFromImportItems(baseInput.items, now)

    expect(confirmedCount).toBe(1)
    expect(movements).toHaveLength(1)
    expect(movements[0]).toMatchObject({
      type: 'expense',
      amount: 1500,
      currency: 'ARS',
      source: 'imported',
      categoryId: 'cat-1',
      paidBy: 'personA',
      isShared: true,
    })
  })

  it('marks pending rows as confirmed and keeps ignored rows', () => {
    const pending = buildConfirmedPendingItems(baseInput.items)

    expect(pending[0].status).toBe('confirmed')
    expect(pending[1].status).toBe('ignored')
  })

  it('builds import record with detected and confirmed counts', () => {
    const record = buildImportRecord(baseInput, 1, '2025-06-01T12:00:00.000Z')

    expect(record).toEqual({
      id: 'import-1',
      accountType: 'credit',
      fileName: 'resumen.pdf',
      importedAt: '2025-06-01T12:00:00.000Z',
      detectedCount: 2,
      confirmedCount: 1,
      status: 'completed',
    })
  })
})

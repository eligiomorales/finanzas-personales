import { normalizeMovementFormData } from '@/lib/balance'
import { generateId } from '@/lib/utils'
import type { ConfirmImportInput, ConfirmImportItem } from '@/lib/repositories/types'
import type { ImportRecord, Movement, PendingImportMovement } from '@/types'

export function buildImportRecord(
  input: ConfirmImportInput,
  confirmedCount: number,
  importedAt: string,
): ImportRecord {
  return {
    id: input.id,
    accountType: input.accountType,
    fileName: input.fileName,
    importedAt,
    detectedCount: input.items.length,
    confirmedCount,
    status: 'completed',
  }
}

export function buildImportedMovement(item: ConfirmImportItem, now: string): Movement {
  const normalized = normalizeMovementFormData({
    type: 'expense',
    amount: item.amount,
    currency: item.currency,
    date: item.date,
    description: item.originalDescription,
    categoryId: item.selectedCategoryId,
    paidBy: item.paidBy,
    sharePersonA: item.sharePersonA,
    sharePersonB: item.sharePersonB,
    isShared: item.isShared,
  })

  return {
    id: generateId(),
    type: 'expense',
    amount: normalized.amount,
    currency: normalized.currency,
    date: normalized.date,
    description: normalized.description,
    categoryId: normalized.categoryId,
    paidBy: normalized.paidBy,
    sharePersonA: normalized.sharePersonA,
    sharePersonB: normalized.sharePersonB,
    isShared: normalized.isShared,
    source: 'imported',
    createdAt: now,
    updatedAt: now,
  }
}

export function buildConfirmedPendingItems(items: ConfirmImportItem[]): PendingImportMovement[] {
  return items.map((item) => ({
    id: item.id,
    importId: item.importId,
    date: item.date,
    originalDescription: item.originalDescription,
    amount: item.amount,
    currency: item.currency,
    merchant: item.merchant,
    suggestedCategoryId: item.selectedCategoryId ?? item.suggestedCategoryId,
    possibleDuplicate: item.possibleDuplicate,
    duplicateMovementId: item.duplicateMovementId,
    status: item.status === 'pending' ? 'confirmed' : item.status,
  }))
}

export function buildMovementsFromImportItems(
  items: ConfirmImportItem[],
  now: string,
): { movements: Movement[]; confirmedCount: number } {
  const movements: Movement[] = []
  let confirmedCount = 0

  for (const item of items) {
    if (item.status !== 'pending') continue
    movements.push(buildImportedMovement(item, now))
    confirmedCount++
  }

  return { movements, confirmedCount }
}

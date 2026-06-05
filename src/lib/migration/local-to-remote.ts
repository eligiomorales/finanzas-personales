import { exportDatabase, type DatabaseBackup } from '@/lib/backup'
import { getSupabaseClient } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'
import type { Repositories } from '@/lib/repositories/types'

export interface MigrationPreview {
  local: {
    movements: number
    incomes: number
    expenses: number
    settlements: number
    categories: number
  }
  remote: {
    movements: number
    incomes: number
    expenses: number
    settlements: number
    categories: number
  }
  alreadyMigrated: boolean
}

function migrationKey(coupleId: string) {
  return `finanzas-migration-done-${coupleId}`
}

export function isMigrationDone(coupleId: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(migrationKey(coupleId)) === 'true'
}

export function markMigrationDone(coupleId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(migrationKey(coupleId), 'true')
}

export async function previewLocalMigration(repos: Repositories, coupleId: string): Promise<MigrationPreview> {
  const backup = await exportDatabase()
  const remoteStats = await repos.getStats()
  const remoteCategories = await repos.categories.list()

  const localMovements = backup.movements
  return {
    local: {
      movements: localMovements.length,
      incomes: localMovements.filter((m) => m.type === 'income').length,
      expenses: localMovements.filter((m) => m.type === 'expense').length,
      settlements: localMovements.filter((m) => m.type === 'settlement').length,
      categories: backup.categories.length,
    },
    remote: {
      movements: remoteStats.total,
      incomes: remoteStats.incomes,
      expenses: remoteStats.expenses,
      settlements: remoteStats.settlements,
      categories: remoteCategories.length,
    },
    alreadyMigrated: isMigrationDone(coupleId),
  }
}

export async function migrateLocalToRemote(coupleId: string, backup?: DatabaseBackup): Promise<void> {
  const data = backup ?? (await exportDatabase())
  const supabase = getSupabaseClient()

  const { data: existingMovements } = await supabase
    .from('movements')
    .select('id')
    .eq('couple_id', coupleId)

  const existingIds = new Set((existingMovements ?? []).map((m) => m.id))

  const categoryIdMap = new Map<string, string>()
  for (const cat of data.categories) {
    categoryIdMap.set(cat.id, cat.id)
  }

  if (data.settings[0]) {
    const s = data.settings[0]
    await supabase
      .from('couple_settings')
      .update({
        person_a_name: s.personAName,
        person_b_name: s.personBName,
        display_currency: s.displayCurrency,
        default_exchange_rate_usd: s.defaultExchangeRateUsd,
      })
      .eq('couple_id', coupleId)
  }

  const remoteCategories = await supabase.from('categories').select('id, name').eq('couple_id', coupleId)
  const remoteByName = new Map((remoteCategories.data ?? []).map((c) => [c.name.toLowerCase(), c.id]))

  for (const cat of data.categories) {
    const existingId = remoteByName.get(cat.name.toLowerCase())
    if (existingId) {
      categoryIdMap.set(cat.id, existingId)
      continue
    }

    const newId = generateId()
    categoryIdMap.set(cat.id, newId)
    await supabase.from('categories').insert({
      id: newId,
      couple_id: coupleId,
      name: cat.name,
      type: cat.type,
      color: cat.color ?? null,
    })
  }

  for (const movement of data.movements) {
    if (existingIds.has(movement.id)) continue

    await supabase.from('movements').insert({
      id: movement.id,
      couple_id: coupleId,
      type: movement.type,
      amount: movement.amount,
      currency: movement.currency,
      date: movement.date,
      description: movement.description,
      category_id: movement.categoryId ? (categoryIdMap.get(movement.categoryId) ?? null) : null,
      paid_by: movement.paidBy,
      share_person_a: movement.sharePersonA,
      share_person_b: movement.sharePersonB,
      is_shared: movement.isShared,
      source: movement.source,
      created_at: movement.createdAt,
      updated_at: movement.updatedAt,
    })
  }

  markMigrationDone(coupleId)
}

import { db } from '@/db/database'
import { normalizeMovementFormData } from '@/lib/balance'
import {
  buildConfirmedPendingItems,
  buildImportRecord,
  buildMovementsFromImportItems,
} from '@/lib/repositories/import-confirm'
import {
  MOVEMENTS_PAGE_SIZE,
  movementMatchesFilters,
  queryMovementsUpToPage,
} from '@/lib/movements-query'
import type {
  CategoryRepository,
  ConfirmImportInput,
  DatabaseStats,
  ImportRepository,
  MovementRepository,
  Repositories,
  SettingsRepository,
} from '@/lib/repositories/types'
import { generateId } from '@/lib/utils'
import type { CurrencyCode, Movement, MovementFilters, MovementFormData } from '@/types'

function noopSubscribe(_callback: () => void): () => void {
  return () => {}
}

class DexieMovementRepository implements MovementRepository {
  async list(): Promise<Movement[]> {
    return db.movements.orderBy('date').reverse().toArray()
  }

  async getById(id: string): Promise<Movement | undefined> {
    return db.movements.get(id)
  }

  async queryUpToPage(filters: MovementFilters, page: number, pageSize = MOVEMENTS_PAGE_SIZE) {
    return queryMovementsUpToPage(filters, page, pageSize)
  }

  async create(data: MovementFormData, source: Movement['source'] = 'manual'): Promise<Movement> {
    const normalized = normalizeMovementFormData(data)
    const now = new Date().toISOString()
    const movement: Movement = {
      id: generateId(),
      ...normalized,
      source,
      createdAt: now,
      updatedAt: now,
    }
    await db.movements.add(movement)
    return movement
  }

  async update(id: string, data: MovementFormData): Promise<void> {
    const normalized = normalizeMovementFormData(data)
    await db.movements.update(id, {
      ...normalized,
      updatedAt: new Date().toISOString(),
    })
  }

  async delete(id: string): Promise<void> {
    await db.movements.delete(id)
  }

  subscribe = noopSubscribe
}

class DexieCategoryRepository implements CategoryRepository {
  async list() {
    return db.categories.toArray()
  }

  async add(name: string, type: 'income' | 'expense', color?: string) {
    const category = { id: generateId(), name, type, color }
    await db.categories.add(category)
    return category
  }

  async update(id: string, data: { name: string; type: 'income' | 'expense'; color?: string }) {
    await db.categories.update(id, {
      name: data.name.trim(),
      type: data.type,
      color: data.color,
    })
  }

  async delete(id: string) {
    await db.categories.delete(id)
  }

  subscribe = noopSubscribe
}

class DexieSettingsRepository implements SettingsRepository {
  async get() {
    return db.settings.get('settings')
  }

  async updateNames(personAName: string, personBName: string) {
    await db.settings.update('settings', { personAName, personBName })
    await db.persons.update('personA', { name: personAName })
    await db.persons.update('personB', { name: personBName })
  }

  async updateExchangeRate(defaultExchangeRateUsd: number) {
    await db.settings.update('settings', { defaultExchangeRateUsd })
  }

  async updateDisplayCurrency(displayCurrency: CurrencyCode) {
    await db.settings.update('settings', { displayCurrency })
  }

  subscribe = noopSubscribe
}

class DexieImportRepository implements ImportRepository {
  async list() {
    return db.imports.orderBy('importedAt').reverse().toArray()
  }

  async listPending(importId?: string) {
    if (importId) {
      return db.pendingImports.where('importId').equals(importId).toArray()
    }
    return db.pendingImports.toArray()
  }

  async confirmImport(input: ConfirmImportInput) {
    const now = new Date().toISOString()
    const { movements, confirmedCount } = buildMovementsFromImportItems(input.items, now)
    const importRecord = buildImportRecord(input, confirmedCount, now)
    const pendingRecords = buildConfirmedPendingItems(input.items)

    await db.transaction('rw', [db.imports, db.pendingImports, db.movements], async () => {
      for (const movement of movements) {
        await db.movements.add(movement)
      }
      await db.imports.add(importRecord)
      for (const pending of pendingRecords) {
        await db.pendingImports.add(pending)
      }
    })

    return confirmedCount
  }

  subscribe = noopSubscribe
}

async function getDexieStats(): Promise<DatabaseStats> {
  const movements = await db.movements.toArray()
  return {
    total: movements.length,
    settlements: movements.filter((m) => m.type === 'settlement').length,
    expenses: movements.filter((m) => m.type === 'expense').length,
    incomes: movements.filter((m) => m.type === 'income').length,
  }
}

let dexieRepos: Repositories | null = null

export function createDexieRepositories(): Repositories {
  if (!dexieRepos) {
    dexieRepos = {
      movements: new DexieMovementRepository(),
      categories: new DexieCategoryRepository(),
      settings: new DexieSettingsRepository(),
      imports: new DexieImportRepository(),
      getStats: getDexieStats,
    }
  }
  return dexieRepos
}

export function filterMovementsInMemory(
  movements: Movement[],
  filters: MovementFilters,
  page: number,
  pageSize: number,
) {
  const filtered = movements
    .filter((m) => movementMatchesFilters(m, filters))
    .sort((a, b) => b.date.localeCompare(a.date))

  const total = filtered.length
  const limit = page * pageSize
  const items = filtered.slice(0, limit)

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: items.length < total,
  }
}

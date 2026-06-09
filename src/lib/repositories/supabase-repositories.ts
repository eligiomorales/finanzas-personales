import { getSupabaseClient } from '@/lib/supabase/client'
import { subscribeToPostgresChanges } from '@/lib/supabase/realtime-subscribe'
import { normalizeMovementFormData } from '@/lib/balance'
import { filterMovementsInMemory } from '@/lib/repositories/dexie-repositories'
import {
  buildConfirmedPendingItems,
  buildImportRecord,
  buildMovementsFromImportItems,
} from '@/lib/repositories/import-confirm'
import type {
  CategoryRepository,
  ConfirmImportInput,
  ImportRepository,
  MovementRepository,
  Repositories,
  SettingsRepository,
  UpsertCategoryBudgetInput,
  BudgetRepository,
} from '@/lib/repositories/types'
import { MOVEMENTS_PAGE_SIZE } from '@/lib/movements-query'
import { generateId } from '@/lib/utils'
import { RECURRING_BUDGET_MONTH } from '@/lib/budget'
import type {
  AppSettings,
  Category,
  CategoryBudget,
  CurrencyCode,
  ImportRecord,
  Movement,
  MovementFilters,
  MovementFormData,
  PendingImportMovement,
} from '@/types'

function rowToMovement(row: {
  id: string
  type: Movement['type']
  amount: number
  currency: Movement['currency']
  date: string
  description: string
  category_id: string | null
  paid_by: Movement['paidBy']
  share_person_a: number
  share_person_b: number
  is_shared: boolean
  source: Movement['source']
  created_at: string
  updated_at: string
}): Movement {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency,
    date: row.date,
    description: row.description,
    categoryId: row.category_id,
    paidBy: row.paid_by,
    sharePersonA: Number(row.share_person_a),
    sharePersonB: Number(row.share_person_b),
    isShared: row.is_shared,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToCategory(row: {
  id: string
  name: string
  type: Category['type']
  color: string | null
}): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color ?? undefined,
  }
}

function rowToSettings(row: {
  couple_id: string
  person_a_name: string
  person_b_name: string
  display_currency: CurrencyCode
  default_exchange_rate_usd: number
}): AppSettings {
  return {
    id: 'settings',
    personAName: row.person_a_name,
    personBName: row.person_b_name,
    displayCurrency: row.display_currency,
    defaultExchangeRateUsd: Number(row.default_exchange_rate_usd),
  }
}

function rowToBudget(row: {
  id: string
  category_id: string
  year_month: string
  amount: number
  currency: CurrencyCode
  scope: CategoryBudget['scope']
  created_at: string
  updated_at: string
}): CategoryBudget {
  return {
    id: row.id,
    categoryId: row.category_id,
    yearMonth: row.year_month,
    amount: Number(row.amount),
    currency: row.currency,
    scope: row.scope,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createSupabaseRepositories(coupleId: string): Repositories {
  const supabase = getSupabaseClient()
  const movementSubscribers = new Set<() => void>()

  function notifyMovementSubscribers() {
    movementSubscribers.forEach((callback) => callback())
  }

  const movements: MovementRepository = {
    async list() {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: false })

      if (error) throw error
      return (data ?? []).map(rowToMovement)
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      return data ? rowToMovement(data) : undefined
    },

    async queryUpToPage(
      filters: MovementFilters,
      page: number,
      pageSize = MOVEMENTS_PAGE_SIZE,
      searchContext?: import('@/lib/movement-search').MovementSearchContext,
    ) {
      const all = await movements.list()
      return filterMovementsInMemory(all, filters, page, pageSize, searchContext)
    },

    async create(data: MovementFormData, source: Movement['source'] = 'manual') {
      const normalized = normalizeMovementFormData(data)
      const now = new Date().toISOString()
      const id = generateId()

      const { data: row, error } = await supabase
        .from('movements')
        .insert({
          id,
          couple_id: coupleId,
          type: normalized.type,
          amount: normalized.amount,
          currency: normalized.currency,
          date: normalized.date,
          description: normalized.description,
          category_id: normalized.categoryId,
          paid_by: normalized.paidBy,
          share_person_a: normalized.sharePersonA,
          share_person_b: normalized.sharePersonB,
          is_shared: normalized.isShared,
          source,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single()

      if (error) throw error
      const movement = rowToMovement(row)
      notifyMovementSubscribers()
      return movement
    },

    async update(id, data) {
      const normalized = normalizeMovementFormData(data)
      const { error } = await supabase
        .from('movements')
        .update({
          type: normalized.type,
          amount: normalized.amount,
          currency: normalized.currency,
          date: normalized.date,
          description: normalized.description,
          category_id: normalized.categoryId,
          paid_by: normalized.paidBy,
          share_person_a: normalized.sharePersonA,
          share_person_b: normalized.sharePersonB,
          is_shared: normalized.isShared,
          updated_at: new Date().toISOString(),
        })
        .eq('couple_id', coupleId)
        .eq('id', id)

      if (error) throw error
      notifyMovementSubscribers()
    },

    async delete(id) {
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('couple_id', coupleId)
        .eq('id', id)

      if (error) throw error
      notifyMovementSubscribers()
    },

    subscribe(callback) {
      movementSubscribers.add(callback)
      const unsubscribeRealtime = subscribeToPostgresChanges(supabase, `movements-${coupleId}`, {
        table: 'movements',
        filter: `couple_id=eq.${coupleId}`,
      }, callback)

      return () => {
        movementSubscribers.delete(callback)
        unsubscribeRealtime()
      }
    },
  }

  const categories: CategoryRepository = {
    async list() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('couple_id', coupleId)
        .order('name')

      if (error) throw error
      return (data ?? []).map(rowToCategory)
    },

    async add(name, type, color) {
      const { data, error } = await supabase
        .from('categories')
        .insert({ couple_id: coupleId, name, type, color: color ?? null })
        .select('*')
        .single()

      if (error) throw error
      return rowToCategory(data)
    },

    async update(id, data) {
      const { error } = await supabase
        .from('categories')
        .update({
          name: data.name.trim(),
          type: data.type,
          color: data.color ?? null,
        })
        .eq('couple_id', coupleId)
        .eq('id', id)

      if (error) throw error
    },

    async delete(id) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('couple_id', coupleId)
        .eq('id', id)

      if (error) throw error
    },

    subscribe(callback) {
      return subscribeToPostgresChanges(supabase, `categories-${coupleId}`, {
        table: 'categories',
        filter: `couple_id=eq.${coupleId}`,
      }, callback)
    },
  }

  const settings: SettingsRepository = {
    async get() {
      const { data, error } = await supabase
        .from('couple_settings')
        .select('*')
        .eq('couple_id', coupleId)
        .maybeSingle()

      if (error) throw error
      return data ? rowToSettings(data) : undefined
    },

    async updateNames(personAName, personBName) {
      const { error } = await supabase
        .from('couple_settings')
        .update({ person_a_name: personAName, person_b_name: personBName })
        .eq('couple_id', coupleId)

      if (error) throw error
    },

    async updateExchangeRate(defaultExchangeRateUsd) {
      const { error } = await supabase
        .from('couple_settings')
        .update({ default_exchange_rate_usd: defaultExchangeRateUsd })
        .eq('couple_id', coupleId)

      if (error) throw error
    },

    async updateDisplayCurrency(displayCurrency) {
      const { error } = await supabase
        .from('couple_settings')
        .update({ display_currency: displayCurrency })
        .eq('couple_id', coupleId)

      if (error) throw error
    },

    subscribe(callback) {
      return subscribeToPostgresChanges(supabase, `settings-${coupleId}`, {
        table: 'couple_settings',
        filter: `couple_id=eq.${coupleId}`,
      }, callback)
    },
  }

  const imports: ImportRepository = {
    async list() {
      const { data, error } = await supabase
        .from('imports')
        .select('*')
        .eq('couple_id', coupleId)
        .order('imported_at', { ascending: false })

      if (error) throw error
      return (data ?? []).map(
        (row): ImportRecord => ({
          id: row.id,
          accountType: row.account_type,
          fileName: row.file_name,
          importedAt: row.imported_at,
          detectedCount: row.detected_count,
          confirmedCount: row.confirmed_count,
          status: row.status,
        }),
      )
    },

    async listPending(importId?: string) {
      let query = supabase.from('pending_import_movements').select('*').eq('couple_id', coupleId)
      if (importId) query = query.eq('import_id', importId)

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map(
        (row): PendingImportMovement => ({
          id: row.id,
          importId: row.import_id,
          date: row.date,
          originalDescription: row.original_description,
          amount: Number(row.amount),
          currency: row.currency,
          merchant: row.merchant ?? undefined,
          suggestedCategoryId: row.suggested_category_id,
          possibleDuplicate: row.possible_duplicate,
          duplicateMovementId: row.duplicate_movement_id ?? undefined,
          status: row.status,
        }),
      )
    },

    async confirmImport(input: ConfirmImportInput) {
      const now = new Date().toISOString()
      const { movements, confirmedCount } = buildMovementsFromImportItems(input.items, now)
      const importRecord = buildImportRecord(input, confirmedCount, now)
      const pendingRecords = buildConfirmedPendingItems(input.items)

      if (movements.length > 0) {
        const { error } = await supabase.from('movements').insert(
          movements.map((movement) => ({
            id: movement.id,
            couple_id: coupleId,
            type: movement.type,
            amount: movement.amount,
            currency: movement.currency,
            date: movement.date,
            description: movement.description,
            category_id: movement.categoryId,
            paid_by: movement.paidBy,
            share_person_a: movement.sharePersonA,
            share_person_b: movement.sharePersonB,
            is_shared: movement.isShared,
            source: movement.source,
            created_at: movement.createdAt,
            updated_at: movement.updatedAt,
          })),
        )
        if (error) throw error
        notifyMovementSubscribers()
      }

      const { error: importError } = await supabase.from('imports').insert({
        id: importRecord.id,
        couple_id: coupleId,
        account_type: importRecord.accountType,
        file_name: importRecord.fileName,
        imported_at: importRecord.importedAt,
        detected_count: importRecord.detectedCount,
        confirmed_count: importRecord.confirmedCount,
        status: importRecord.status,
      })
      if (importError) throw importError

      if (pendingRecords.length > 0) {
        const { error: pendingError } = await supabase.from('pending_import_movements').insert(
          pendingRecords.map((pending) => ({
            id: pending.id,
            couple_id: coupleId,
            import_id: pending.importId,
            date: pending.date,
            original_description: pending.originalDescription,
            amount: pending.amount,
            currency: pending.currency,
            merchant: pending.merchant ?? null,
            suggested_category_id: pending.suggestedCategoryId,
            possible_duplicate: pending.possibleDuplicate,
            duplicate_movement_id: pending.duplicateMovementId ?? null,
            status: pending.status,
          })),
        )
        if (pendingError) throw pendingError
      }

      return confirmedCount
    },

    subscribe(callback) {
      const unsubscribeImports = subscribeToPostgresChanges(supabase, `imports-${coupleId}`, {
        table: 'imports',
        filter: `couple_id=eq.${coupleId}`,
      }, callback)

      const unsubscribePending = subscribeToPostgresChanges(
        supabase,
        `pending-imports-${coupleId}`,
        {
          table: 'pending_import_movements',
          filter: `couple_id=eq.${coupleId}`,
        },
        callback,
      )

      return () => {
        unsubscribeImports()
        unsubscribePending()
      }
    },
  }

  const budgets: BudgetRepository = {
    async listAll() {
      const { data, error } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('couple_id', coupleId)

      if (error) throw error
      return (data ?? []).map(rowToBudget)
    },

    async listRecurring(scope = 'couple') {
      const { data, error } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('year_month', RECURRING_BUDGET_MONTH)
        .eq('scope', scope)

      if (error) throw error
      return (data ?? []).map(rowToBudget)
    },

    async upsert(input: UpsertCategoryBudgetInput) {
      const scope = input.scope ?? 'couple'
      const yearMonth = input.yearMonth ?? RECURRING_BUDGET_MONTH
      const now = new Date().toISOString()

      const { data: existing, error: findError } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('category_id', input.categoryId)
        .eq('year_month', yearMonth)
        .eq('scope', scope)
        .maybeSingle()

      if (findError) throw findError

      if (existing) {
        const { data, error } = await supabase
          .from('category_budgets')
          .update({
            amount: input.amount,
            currency: input.currency,
            updated_at: now,
          })
          .eq('couple_id', coupleId)
          .eq('id', existing.id)
          .select('*')
          .single()

        if (error) throw error
        return rowToBudget(data)
      }

      const id = generateId()
      const { data, error } = await supabase
        .from('category_budgets')
        .insert({
          id,
          couple_id: coupleId,
          category_id: input.categoryId,
          year_month: yearMonth,
          amount: input.amount,
          currency: input.currency,
          scope,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single()

      if (error) throw error
      return rowToBudget(data)
    },

    async delete(id) {
      const { error } = await supabase
        .from('category_budgets')
        .delete()
        .eq('couple_id', coupleId)
        .eq('id', id)

      if (error) throw error
    },

    subscribe(callback) {
      return subscribeToPostgresChanges(supabase, `category-budgets-${coupleId}`, {
        table: 'category_budgets',
        filter: `couple_id=eq.${coupleId}`,
      }, callback)
    },
  }

  return {
    movements,
    categories,
    settings,
    imports,
    budgets,
    async getStats() {
      const all = await movements.list()
      return {
        total: all.length,
        settlements: all.filter((m) => m.type === 'settlement').length,
        expenses: all.filter((m) => m.type === 'expense').length,
        incomes: all.filter((m) => m.type === 'income').length,
      }
    },
  }
}

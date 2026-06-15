import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { useDataContext, useRepositories } from '@/contexts/DataContext'
import type { ConfirmImportInput } from '@/lib/repositories/types'
import type { UpsertCategoryBudgetInput } from '@/lib/repositories/types'
import type { CurrencyCode, MovementFilters, MovementFormData } from '@/types'
import type { MovementSearchContext } from '@/lib/movement-search'
import { updateMyDisplayName } from '@/lib/couple/persons'
import { filterAllMovementsInMemory } from '@/lib/repositories/dexie-repositories'
import { serializeMovementFilters } from '@/lib/movements-query'
import { RECURRING_BUDGET_MONTH } from '@/lib/budget'
import { queryKeys } from '@/lib/query/keys'
import { isInitialRemoteLoad, useRemoteQuery } from '@/hooks/useRemoteQuery'

function buildFilteredMovementsSearchContextKey(searchContext?: MovementSearchContext): string {
  if (!searchContext) return ''
  return JSON.stringify({
    categories: searchContext.categories.map((c) => [c.id, c.name]),
    persons: {
      personAName: searchContext.persons.personAName,
      personBName: searchContext.persons.personBName,
      myRole: searchContext.persons.myRole,
    },
    amountView: searchContext.amountView
      ? {
          displayCurrency: searchContext.amountView.currencyConfig.displayCurrency,
          exchangeRateUsd: searchContext.amountView.currencyConfig.exchangeRateUsd,
          expenseViewMode: searchContext.amountView.expenseViewMode,
          personalRole: searchContext.amountView.personalRole,
        }
      : undefined,
  })
}

export function useSettings() {
  const { mode, repos, coupleId } = useDataContext()
  const local = useLiveQuery(() => db.settings.get('settings'), [])
  const remote = useRemoteQuery(queryKeys.settings(coupleId ?? 'local'), () => repos.settings.get())

  return mode === 'local' ? local : remote.data
}

export function useCategories() {
  const { mode, repos, coupleId } = useDataContext()
  const local = useLiveQuery(() => db.categories.toArray(), [])
  const remote = useRemoteQuery(queryKeys.categories(coupleId ?? 'local'), () => repos.categories.list())

  return mode === 'local' ? (local ?? []) : (remote.data ?? [])
}

export function useMovements() {
  const { mode, repos, coupleId } = useDataContext()
  const local = useLiveQuery(() => db.movements.orderBy('date').reverse().toArray(), [])
  const remote = useRemoteQuery(queryKeys.movements(coupleId ?? 'local'), () => repos.movements.list())

  return mode === 'local' ? (local ?? undefined) : remote.data
}

export function useFilteredMovements(
  filters: MovementFilters,
  searchContext?: MovementSearchContext,
) {
  const { mode, repos, coupleId } = useDataContext()
  const filtersKey = serializeMovementFilters(filters)
  const searchContextKey = buildFilteredMovementsSearchContextKey(searchContext)
  const queryKey = `${filtersKey}|${searchContextKey}`

  const local = useLiveQuery(
    async () => {
      const result = await repos.movements.queryFiltered(filters, searchContext)
      return { ...result, queryKey }
    },
    [queryKey, repos],
  )

  const movementsQuery = useRemoteQuery(queryKeys.movements(coupleId ?? 'local'), () =>
    repos.movements.list(),
  )

  const remoteFiltered = useMemo(() => {
    if (mode !== 'remote' || movementsQuery.data === undefined) return undefined
    const result = filterAllMovementsInMemory(movementsQuery.data, filters, searchContext)
    return { ...result, queryKey }
  }, [mode, movementsQuery.data, filters, searchContextKey, queryKey, searchContext])

  return {
    query: mode === 'local' ? local : remoteFiltered,
    queryKey,
    isLoading: mode === 'remote' && isInitialRemoteLoad(movementsQuery),
    isError: mode === 'remote' && movementsQuery.isError,
    error: movementsQuery.error,
  }
}

export function useImports() {
  const { mode, repos, coupleId } = useDataContext()
  const local = useLiveQuery(() => db.imports.orderBy('importedAt').reverse().toArray(), [])
  const remote = useRemoteQuery(queryKeys.imports(coupleId ?? 'local'), () => repos.imports.list())

  return mode === 'local' ? (local ?? []) : (remote.data ?? [])
}

export function usePendingImports(importId?: string) {
  const { mode, repos, coupleId } = useDataContext()
  const local = useLiveQuery(
    () =>
      importId
        ? db.pendingImports.where('importId').equals(importId).toArray()
        : db.pendingImports.toArray(),
    [importId],
  )
  const remote = useRemoteQuery(queryKeys.pendingImports(coupleId ?? 'local', importId), () =>
    repos.imports.listPending(importId),
  )

  return mode === 'local' ? (local ?? []) : (remote.data ?? [])
}

export function useBudgets() {
  const { mode, repos, coupleId } = useDataContext()
  const local = useLiveQuery(
    () => db.categoryBudgets.where('yearMonth').equals(RECURRING_BUDGET_MONTH).toArray(),
    [],
  )
  const remote = useRemoteQuery(queryKeys.budgets(coupleId ?? 'local'), () => repos.budgets.listRecurring())

  return mode === 'local' ? (local ?? []) : (remote.data ?? [])
}

export function useDatabaseStats() {
  const { mode, repos, coupleId } = useDataContext()
  const local = useLiveQuery(() => repos.getStats(), [repos])
  const movementsQuery = useRemoteQuery(queryKeys.movements(coupleId ?? 'local'), () =>
    repos.movements.list(),
  )

  const remoteStats = useMemo(() => {
    if (mode !== 'remote' || movementsQuery.data === undefined) return undefined
    const movements = movementsQuery.data
    return {
      total: movements.length,
      settlements: movements.filter((m) => m.type === 'settlement').length,
      expenses: movements.filter((m) => m.type === 'expense').length,
      incomes: movements.filter((m) => m.type === 'income').length,
    }
  }, [mode, movementsQuery.data])

  return mode === 'local' ? local : remoteStats
}

/** True while core remote resources are loading for the first time (no cached data yet). */
export function useCoreDataLoading(): boolean {
  const { mode, repos, coupleId } = useDataContext()

  const settings = useRemoteQuery(queryKeys.settings(coupleId ?? 'local'), () => repos.settings.get())
  const categories = useRemoteQuery(queryKeys.categories(coupleId ?? 'local'), () => repos.categories.list())
  const movements = useRemoteQuery(queryKeys.movements(coupleId ?? 'local'), () => repos.movements.list())

  if (mode !== 'remote') return false

  return (
    isInitialRemoteLoad(settings) ||
    isInitialRemoteLoad(categories) ||
    isInitialRemoteLoad(movements)
  )
}

export function useMovementMutations() {
  const repos = useRepositories()

  return {
    createMovement: useCallback((data: MovementFormData) => repos.movements.create(data), [repos]),
    updateMovement: useCallback(
      (id: string, data: MovementFormData) => repos.movements.update(id, data),
      [repos],
    ),
    deleteMovement: useCallback((id: string) => repos.movements.delete(id), [repos]),
    getMovement: useCallback((id: string) => repos.movements.getById(id), [repos]),
  }
}

export function useImportMutations() {
  const repos = useRepositories()

  return {
    confirmImport: useCallback(
      (input: ConfirmImportInput) => repos.imports.confirmImport(input),
      [repos],
    ),
  }
}

export function useDataMutations() {
  const repos = useRepositories()

  return {
    createSettlement: useCallback(
      async (
        amount: number,
        paidBy: 'personA' | 'personB',
        description: string,
        date: string,
        currency?: CurrencyCode,
      ) => {
        const settings = await repos.settings.get()
        const settlementCurrency = currency ?? settings?.displayCurrency ?? 'ARS'
        return repos.movements.create({
          type: 'settlement',
          amount,
          currency: settlementCurrency,
          date,
          description,
          categoryId: null,
          paidBy,
          sharePersonA: 0,
          sharePersonB: 0,
          isShared: true,
        })
      },
      [repos],
    ),
    updateSettings: useCallback(
      (personAName: string, personBName: string) => repos.settings.updateNames(personAName, personBName),
      [repos],
    ),
    updateDisplayName: useCallback(
      (userId: string, coupleId: string, role: 'personA' | 'personB', displayName: string) =>
        updateMyDisplayName(userId, coupleId, role, displayName),
      [],
    ),
    updateExchangeRate: useCallback(
      (defaultExchangeRateUsd: number) => repos.settings.updateExchangeRate(defaultExchangeRateUsd),
      [repos],
    ),
    updateDisplayCurrency: useCallback(
      (displayCurrency: CurrencyCode) => repos.settings.updateDisplayCurrency(displayCurrency),
      [repos],
    ),
    addCategory: useCallback(
      (name: string, type: 'income' | 'expense', color?: string) => repos.categories.add(name, type, color),
      [repos],
    ),
    updateCategory: useCallback(
      (id: string, data: { name: string; type: 'income' | 'expense'; color?: string }) =>
        repos.categories.update(id, data),
      [repos],
    ),
    deleteCategory: useCallback((id: string) => repos.categories.delete(id), [repos]),
  }
}

export function useBudgetMutations() {
  const repos = useRepositories()

  return {
    upsertBudget: useCallback(
      (input: UpsertCategoryBudgetInput) => repos.budgets.upsert(input),
      [repos],
    ),
    deleteBudget: useCallback((id: string) => repos.budgets.delete(id), [repos]),
  }
}

import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { useDataContext, useRepositories } from '@/contexts/DataContext'
import type { ConfirmImportInput } from '@/lib/repositories/types'
import type { UpsertCategoryBudgetInput } from '@/lib/repositories/types'
import type { CurrencyCode, Movement, MovementFilters, MovementFormData } from '@/types'
import { updateMyDisplayName } from '@/lib/couple/persons'
import {
  MOVEMENTS_PAGE_SIZE,
  serializeMovementFilters,
} from '@/lib/movements-query'
import { RECURRING_BUDGET_MONTH } from '@/lib/budget'

export function useSettings() {
  const { mode, repos } = useDataContext()
  const local = useLiveQuery(() => db.settings.get('settings'), [])
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof repos.settings.get>>>(undefined)

  useEffect(() => {
    if (mode !== 'remote') return
    let cancelled = false

    async function load() {
      const result = await repos.settings.get()
      if (!cancelled) setRemote(result)
    }

    void load()
    return repos.settings.subscribe(() => {
      void load()
    })
  }, [mode, repos])

  return mode === 'local' ? local : remote
}

export function useCategories() {
  const { mode, repos } = useDataContext()
  const local = useLiveQuery(() => db.categories.toArray(), [])
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof repos.categories.list>>>([])

  useEffect(() => {
    if (mode !== 'remote') return
    let cancelled = false

    async function load() {
      const result = await repos.categories.list()
      if (!cancelled) setRemote(result)
    }

    void load()
    return repos.categories.subscribe(() => {
      void load()
    })
  }, [mode, repos])

  return mode === 'local' ? (local ?? []) : remote
}

export function useMovements() {
  const { mode, repos } = useDataContext()
  const local = useLiveQuery(() => db.movements.orderBy('date').reverse().toArray(), [])
  const [remote, setRemote] = useState<Movement[]>([])

  useEffect(() => {
    if (mode !== 'remote') return
    let cancelled = false

    async function load() {
      const result = await repos.movements.list()
      if (!cancelled) setRemote(result)
    }

    void load()
    return repos.movements.subscribe(() => {
      void load()
    })
  }, [mode, repos])

  return mode === 'local' ? (local ?? []) : remote
}

export function useFilteredMovements(filters: MovementFilters, page: number) {
  const { mode, repos } = useDataContext()
  const filtersKey = serializeMovementFilters(filters)

  const local = useLiveQuery(
    () => repos.movements.queryUpToPage(filters, page, MOVEMENTS_PAGE_SIZE),
    [filtersKey, page, repos],
  )

  const [remote, setRemote] = useState<Awaited<ReturnType<typeof repos.movements.queryUpToPage>> | undefined>(
    undefined,
  )

  useEffect(() => {
    if (mode !== 'remote') return
    let cancelled = false

    async function load() {
      const result = await repos.movements.queryUpToPage(filters, page, MOVEMENTS_PAGE_SIZE)
      if (!cancelled) setRemote(result)
    }

    void load()
    return repos.movements.subscribe(() => {
      void load()
    })
  }, [mode, repos, filtersKey, page, filters])

  return mode === 'local' ? local : remote
}

export function useImports() {
  const { mode, repos } = useDataContext()
  const local = useLiveQuery(() => db.imports.orderBy('importedAt').reverse().toArray(), [])
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof repos.imports.list>>>([])

  useEffect(() => {
    if (mode !== 'remote') return
    let cancelled = false

    async function load() {
      const result = await repos.imports.list()
      if (!cancelled) setRemote(result)
    }

    void load()
    return repos.imports.subscribe(() => {
      void load()
    })
  }, [mode, repos])

  return mode === 'local' ? (local ?? []) : remote
}

export function usePendingImports(importId?: string) {
  const { mode, repos } = useDataContext()
  const local = useLiveQuery(
    () =>
      importId
        ? db.pendingImports.where('importId').equals(importId).toArray()
        : db.pendingImports.toArray(),
    [importId],
  )
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof repos.imports.listPending>>>([])

  useEffect(() => {
    if (mode !== 'remote') return
    let cancelled = false

    async function load() {
      const result = await repos.imports.listPending(importId)
      if (!cancelled) setRemote(result)
    }

    void load()
    return repos.imports.subscribe(() => {
      void load()
    })
  }, [mode, repos, importId])

  return mode === 'local' ? (local ?? []) : remote
}

export function useBudgets() {
  const { mode, repos } = useDataContext()
  const local = useLiveQuery(
    () => db.categoryBudgets.where('yearMonth').equals(RECURRING_BUDGET_MONTH).toArray(),
    [],
  )
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof repos.budgets.listRecurring>>>([])

  useEffect(() => {
    if (mode !== 'remote') return
    let cancelled = false

    async function load() {
      const result = await repos.budgets.listRecurring()
      if (!cancelled) setRemote(result)
    }

    void load()
    return repos.budgets.subscribe(() => {
      void load()
    })
  }, [mode, repos])

  return mode === 'local' ? (local ?? []) : remote
}

export function useDatabaseStats() {
  const { mode, repos } = useDataContext()
  const local = useLiveQuery(() => repos.getStats(), [repos])
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof repos.getStats>> | undefined>(undefined)

  useEffect(() => {
    if (mode !== 'remote') return
    let cancelled = false

    async function load() {
      const result = await repos.getStats()
      if (!cancelled) setRemote(result)
    }

    void load()
    return repos.movements.subscribe(() => {
      void load()
    })
  }, [mode, repos])

  return mode === 'local' ? local : remote
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

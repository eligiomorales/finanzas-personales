import { describe, it, expect } from 'vitest'
import {
  exportDatabaseFromRepositories,
  getBackupReminderStatus,
  BACKUP_REMINDER_DAYS,
} from '@/lib/backup'
import type { Repositories } from '@/lib/repositories/types'
import { previousPeriodForRange } from '@/lib/utils'

describe('previousPeriodForRange', () => {
  it('returns the immediately preceding period of equal length', () => {
    expect(previousPeriodForRange({ from: '2026-05-01', to: '2026-05-31' })).toEqual({
      from: '2026-04-01',
      to: '2026-04-30',
    })
  })

  it('handles rolling 30-day windows', () => {
    expect(previousPeriodForRange({ from: '2026-05-02', to: '2026-05-31' })).toEqual({
      from: '2026-04-02',
      to: '2026-05-01',
    })
  })
})

describe('exportDatabaseFromRepositories', () => {
  it('aggregates all repository data into a v4 backup', async () => {
    const movement = {
      id: 'm1',
      type: 'expense' as const,
      amount: 100,
      currency: 'ARS' as const,
      date: '2026-06-01',
      description: 'Test',
      categoryId: null,
      paidBy: 'personA' as const,
      sharePersonA: 50,
      sharePersonB: 50,
      isShared: true,
      source: 'manual' as const,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    }

    const repos: Repositories = {
      movements: {
        list: async () => [movement],
        getById: async () => movement,
        queryUpToPage: async () => ({ items: [movement], total: 1, page: 1, pageSize: 50, hasMore: false }),
        create: async () => movement,
        update: async () => {},
        delete: async () => {},
        subscribe: () => () => {},
      },
      categories: {
        list: async () => [{ id: 'c1', name: 'Comida', type: 'expense' }],
        add: async () => ({ id: 'c2', name: 'X', type: 'expense' }),
        update: async () => {},
        delete: async () => {},
        subscribe: () => () => {},
      },
      settings: {
        get: async () => ({
          id: 'settings',
          personAName: 'Ana',
          personBName: 'Luis',
          displayCurrency: 'ARS',
          defaultExchangeRateUsd: 1200,
        }),
        updateNames: async () => {},
        updateExchangeRate: async () => {},
        updateDisplayCurrency: async () => {},
        subscribe: () => () => {},
      },
      imports: {
        list: async () => [],
        listPending: async () => [],
        confirmImport: async () => 0,
        subscribe: () => () => {},
      },
      budgets: {
        listAll: async () => [],
        listByMonth: async () => [],
        upsert: async () => ({
          id: 'b1',
          categoryId: 'c1',
          yearMonth: '2026-06',
          amount: 1000,
          currency: 'ARS',
          scope: 'couple',
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
        }),
        delete: async () => {},
        subscribe: () => () => {},
      },
      getStats: async () => ({ total: 1, settlements: 0, expenses: 1, incomes: 0 }),
    }

    const backup = await exportDatabaseFromRepositories(repos)

    expect(backup.version).toBe(4)
    expect(backup.movements).toHaveLength(1)
    expect(backup.categories).toHaveLength(1)
    expect(backup.persons).toEqual([
      { id: 'personA', name: 'Ana' },
      { id: 'personB', name: 'Luis' },
    ])
    expect(backup.settings).toHaveLength(1)
    expect(backup.categoryBudgets).toEqual([])
  })
})

describe('getBackupReminderStatus', () => {
  const now = new Date('2026-05-31T12:00:00.000Z')

  it('flags missing backup as never exported', () => {
    expect(getBackupReminderStatus(null, now)).toEqual({
      neverExported: true,
      overdue: true,
      daysSince: null,
    })
  })

  it('marks backup as overdue after reminder threshold', () => {
    const lastBackupAt = new Date(now)
    lastBackupAt.setDate(lastBackupAt.getDate() - BACKUP_REMINDER_DAYS)

    const status = getBackupReminderStatus(lastBackupAt.toISOString(), now)
    expect(status.neverExported).toBe(false)
    expect(status.overdue).toBe(true)
    expect(status.daysSince).toBe(BACKUP_REMINDER_DAYS)
  })

  it('does not mark recent backup as overdue', () => {
    const lastBackupAt = new Date(now)
    lastBackupAt.setDate(lastBackupAt.getDate() - 3)

    const status = getBackupReminderStatus(lastBackupAt.toISOString(), now)
    expect(status.overdue).toBe(false)
    expect(status.daysSince).toBe(3)
  })
})

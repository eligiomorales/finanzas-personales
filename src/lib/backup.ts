import { db } from '@/db/database'
import type { Repositories } from '@/lib/repositories/types'
import type {
  AppSettings,
  Category,
  CategoryBudget,
  ImportRecord,
  Movement,
  PendingImportMovement,
  Person,
} from '@/types'
import { normalizeMovement, normalizePendingImport, normalizeSettings } from '@/lib/currency'

export interface DatabaseBackup {
  version: 1 | 2 | 3 | 4
  exportedAt: string
  origin?: string
  persons: Person[]
  categories: Category[]
  movements: Movement[]
  imports: ImportRecord[]
  pendingImports: PendingImportMovement[]
  settings: AppSettings[]
  categoryBudgets?: CategoryBudget[]
}

function personsFromSettings(settings: AppSettings | undefined): Person[] {
  if (!settings) return []
  return [
    { id: 'personA', name: settings.personAName },
    { id: 'personB', name: settings.personBName },
  ]
}

function buildBackupPayload(
  data: Omit<DatabaseBackup, 'version' | 'exportedAt' | 'origin'>,
): DatabaseBackup {
  return {
    version: 4,
    exportedAt: new Date().toISOString(),
    origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    categoryBudgets: data.categoryBudgets ?? [],
    ...data,
  }
}

/** Exporta desde Supabase (u otro backend remoto) vía repositorios. */
export async function exportDatabaseFromRepositories(repos: Repositories): Promise<DatabaseBackup> {
  const [categories, movements, imports, pendingImports, settingsRow, categoryBudgets] =
    await Promise.all([
      repos.categories.list(),
      repos.movements.list(),
      repos.imports.list(),
      repos.imports.listPending(),
      repos.settings.get(),
      repos.budgets.listAll(),
    ])

  return buildBackupPayload({
    persons: personsFromSettings(settingsRow),
    categories,
    movements,
    imports,
    pendingImports,
    settings: settingsRow ? [settingsRow] : [],
    categoryBudgets,
  })
}

/** Exporta desde IndexedDB (modo local sin Supabase). */
export async function exportDatabase(): Promise<DatabaseBackup> {
  const [persons, categories, movements, imports, pendingImports, settings, categoryBudgets] =
    await Promise.all([
    db.persons.toArray(),
    db.categories.toArray(),
    db.movements.toArray(),
    db.imports.toArray(),
    db.pendingImports.toArray(),
    db.settings.toArray(),
    db.categoryBudgets.toArray(),
  ])

  return buildBackupPayload({
    persons,
    categories,
    movements,
    imports,
    pendingImports,
    settings,
    categoryBudgets,
  })
}

export function downloadBackup(data: DatabaseBackup, fileName?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName ?? `finanzas-backup-${data.exportedAt.slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
  recordBackupExport(data.exportedAt)
}

export const LAST_BACKUP_KEY = 'finanzas-last-backup-at'

export function recordBackupExport(exportedAt = new Date().toISOString()) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_BACKUP_KEY, exportedAt)
}

export function getLastBackupAt(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LAST_BACKUP_KEY)
}

export const BACKUP_REMINDER_DAYS = 14

export interface BackupReminderStatus {
  neverExported: boolean
  overdue: boolean
  daysSince: number | null
}

export function getBackupReminderStatus(
  lastBackupAt: string | null,
  now = new Date(),
): BackupReminderStatus {
  if (!lastBackupAt) {
    return { neverExported: true, overdue: true, daysSince: null }
  }

  const exportedAt = new Date(lastBackupAt)
  if (Number.isNaN(exportedAt.getTime())) {
    return { neverExported: true, overdue: true, daysSince: null }
  }

  const daysSince = Math.floor((now.getTime() - exportedAt.getTime()) / (1000 * 60 * 60 * 24))
  return {
    neverExported: false,
    overdue: daysSince >= BACKUP_REMINDER_DAYS,
    daysSince,
  }
}

function migrateBackup(data: DatabaseBackup): DatabaseBackup {
  return {
    ...data,
    version: 4,
    categoryBudgets: data.categoryBudgets ?? [],
    settings: data.settings.map((s) => normalizeSettings(s as unknown as Record<string, unknown>)),
    movements: data.movements.map((m) => normalizeMovement(m as unknown as Record<string, unknown>)),
    pendingImports: data.pendingImports.map((p) =>
      normalizePendingImport(p as unknown as Record<string, unknown>),
    ) as PendingImportMovement[],
  }
}

export async function importDatabase(data: DatabaseBackup): Promise<void> {
  if (data.version !== 1 && data.version !== 2 && data.version !== 3 && data.version !== 4) {
    throw new Error('Versión de backup no compatible')
  }

  const migrated = data.version === 4 ? { ...data, categoryBudgets: data.categoryBudgets ?? [] } : migrateBackup(data)

  await db.transaction(
    'rw',
    [db.persons, db.categories, db.movements, db.imports, db.pendingImports, db.settings, db.categoryBudgets],
    async () => {
      await Promise.all([
        db.persons.clear(),
        db.categories.clear(),
        db.movements.clear(),
        db.imports.clear(),
        db.pendingImports.clear(),
        db.settings.clear(),
        db.categoryBudgets.clear(),
      ])

      await db.persons.bulkPut(migrated.persons)
      await db.categories.bulkPut(migrated.categories)
      await db.movements.bulkPut(migrated.movements)
      await db.imports.bulkPut(migrated.imports)
      await db.pendingImports.bulkPut(migrated.pendingImports)
      await db.settings.bulkPut(migrated.settings)
      await db.categoryBudgets.bulkPut(migrated.categoryBudgets ?? [])
    },
  )
}

export async function getDatabaseStats() {
  const movements = await db.movements.toArray()
  return {
    total: movements.length,
    settlements: movements.filter((m) => m.type === 'settlement').length,
    expenses: movements.filter((m) => m.type === 'expense').length,
    incomes: movements.filter((m) => m.type === 'income').length,
  }
}

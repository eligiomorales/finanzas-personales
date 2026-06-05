import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  Category,
  ImportRecord,
  Movement,
  PendingImportMovement,
  Person,
} from '@/types'
import { normalizeMovement, normalizePendingImport, normalizeSettings } from '@/lib/currency'

export class FinanzasDB extends Dexie {
  persons!: EntityTable<Person, 'id'>
  categories!: EntityTable<Category, 'id'>
  movements!: EntityTable<Movement, 'id'>
  imports!: EntityTable<ImportRecord, 'id'>
  pendingImports!: EntityTable<PendingImportMovement, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('FinanzasParejaDB')
    this.version(1).stores({
      persons: 'id',
      categories: 'id',
      movements: 'id, date, type, categoryId, paidBy, isShared, source',
      imports: 'id, importedAt, status',
      pendingImports: 'id, importId, status, date',
      settings: 'id',
    })
    this.version(2)
      .stores({
        persons: 'id',
        categories: 'id',
        movements: 'id, date, type, categoryId, paidBy, isShared, source, currency',
        imports: 'id, importedAt, status',
        pendingImports: 'id, importId, status, date',
        settings: 'id',
      })
      .upgrade(async (tx) => {
        const settingsRows = await tx.table('settings').toArray()
        for (const raw of settingsRows) {
          await tx.table('settings').put(normalizeSettings(raw as Record<string, unknown>))
        }

        const movements = await tx.table('movements').toArray()
        for (const raw of movements) {
          await tx.table('movements').put(normalizeMovement(raw as Record<string, unknown>))
        }

        const pending = await tx.table('pendingImports').toArray()
        for (const raw of pending) {
          await tx.table('pendingImports').put(normalizePendingImport(raw as Record<string, unknown>))
        }
      })
    this.version(3)
      .stores({
        persons: 'id',
        categories: 'id',
        movements: 'id, date, type, categoryId, paidBy, isShared, source, currency',
        imports: 'id, importedAt, status',
        pendingImports: 'id, importId, status, date',
        settings: 'id',
      })
      .upgrade(async (tx) => {
        const settingsRows = await tx.table('settings').toArray()
        for (const raw of settingsRows) {
          const normalized = normalizeSettings(raw as Record<string, unknown>)
          await tx.table('settings').put(normalized)
        }

        const movements = await tx.table('movements').toArray()
        for (const raw of movements) {
          const normalized = normalizeMovement(raw as Record<string, unknown>)
          await tx.table('movements').put(normalized)
        }

        const pending = await tx.table('pendingImports').toArray()
        for (const raw of pending) {
          await tx.table('pendingImports').put(normalizePendingImport(raw as Record<string, unknown>))
        }
      })
  }
}

export const db = new FinanzasDB()

import type {
  AccountType,
  AppSettings,
  Category,
  CategoryBudget,
  CurrencyCode,
  ImportRecord,
  Movement,
  MovementFilters,
  MovementFormData,
  Payer,
  PendingImportMovement,
} from '@/types'
import type { MovementSearchContext } from '@/lib/movement-search'

export interface ConfirmImportItem extends PendingImportMovement {
  selectedCategoryId: string | null
  paidBy: Payer
  isShared: boolean
  sharePersonA: number
  sharePersonB: number
}

export interface ConfirmImportInput {
  id: string
  accountType: AccountType
  fileName: string
  items: ConfirmImportItem[]
}

export interface MovementsQueryResult {
  items: Movement[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface MovementRepository {
  list(): Promise<Movement[]>
  getById(id: string): Promise<Movement | undefined>
  queryUpToPage(
    filters: MovementFilters,
    page: number,
    pageSize: number,
    searchContext?: MovementSearchContext,
  ): Promise<MovementsQueryResult>
  create(data: MovementFormData, source?: Movement['source']): Promise<Movement>
  update(id: string, data: MovementFormData): Promise<void>
  delete(id: string): Promise<void>
  subscribe(callback: () => void): () => void
}

export interface CategoryRepository {
  list(): Promise<Category[]>
  add(name: string, type: 'income' | 'expense', color?: string): Promise<Category>
  update(id: string, data: { name: string; type: 'income' | 'expense'; color?: string }): Promise<void>
  delete(id: string): Promise<void>
  subscribe(callback: () => void): () => void
}

export interface SettingsRepository {
  get(): Promise<AppSettings | undefined>
  updateNames(personAName: string, personBName: string): Promise<void>
  updateExchangeRate(defaultExchangeRateUsd: number): Promise<void>
  updateDisplayCurrency(displayCurrency: CurrencyCode): Promise<void>
  subscribe(callback: () => void): () => void
}

export interface ImportRepository {
  list(): Promise<ImportRecord[]>
  listPending(importId?: string): Promise<PendingImportMovement[]>
  confirmImport(input: ConfirmImportInput): Promise<number>
  subscribe(callback: () => void): () => void
}

export interface UpsertCategoryBudgetInput {
  categoryId: string
  yearMonth?: string
  amount: number
  currency: CurrencyCode
  scope?: CategoryBudget['scope']
}

export interface BudgetRepository {
  listAll(): Promise<CategoryBudget[]>
  listRecurring(scope?: CategoryBudget['scope']): Promise<CategoryBudget[]>
  upsert(input: UpsertCategoryBudgetInput): Promise<CategoryBudget>
  delete(id: string): Promise<void>
  subscribe(callback: () => void): () => void
}

export interface DatabaseStats {
  total: number
  settlements: number
  expenses: number
  incomes: number
}

export interface Repositories {
  movements: MovementRepository
  categories: CategoryRepository
  settings: SettingsRepository
  imports: ImportRepository
  budgets: BudgetRepository
  getStats(): Promise<DatabaseStats>
}

export type DataMode = 'local' | 'remote'

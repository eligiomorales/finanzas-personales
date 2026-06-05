export type CurrencyCode = 'ARS' | 'USD'

export type MovementType = 'income' | 'expense' | 'settlement'
export type CategoryType = 'income' | 'expense'
export type Payer = 'personA' | 'personB' | 'both'
export type MovementSource = 'manual' | 'imported'
export type AccountType = 'credit' | 'debit'
export type ImportStatus = 'pending' | 'completed' | 'cancelled'
export type PendingImportStatus = 'pending' | 'confirmed' | 'ignored'

export interface Person {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  color?: string
}

export interface Movement {
  id: string
  type: MovementType
  amount: number
  currency: CurrencyCode
  date: string
  description: string
  categoryId: string | null
  paidBy: Payer
  sharePersonA: number
  sharePersonB: number
  isShared: boolean
  source: MovementSource
  createdAt: string
  updatedAt: string
}

export interface ImportRecord {
  id: string
  accountType: AccountType
  fileName: string
  importedAt: string
  detectedCount: number
  confirmedCount: number
  status: ImportStatus
}

export interface PendingImportMovement {
  id: string
  importId: string
  date: string
  originalDescription: string
  amount: number
  currency: CurrencyCode
  merchant?: string
  suggestedCategoryId: string | null
  possibleDuplicate: boolean
  duplicateMovementId?: string
  status: PendingImportStatus
}

export interface AppSettings {
  id: 'settings'
  personAName: string
  personBName: string
  /** Active view currency for totals, balances and converted amounts. */
  displayCurrency: CurrencyCode
  /** Global exchange rate: 1 USD = X ARS. */
  defaultExchangeRateUsd: number
}

export interface MovementFilters {
  dateFrom?: string
  dateTo?: string
  categoryId?: string
  type?: MovementType
  paidBy?: Payer
  source?: MovementSource
  isShared?: boolean
  currency?: CurrencyCode
  search?: string
  /** When set, hide movements not visible in personal view for this role. */
  personalViewRole?: 'personA' | 'personB'
}

export interface PersonBalance {
  paid: number
  assumed: number
  difference: number
}

export interface CoupleBalance {
  personA: PersonBalance
  personB: PersonBalance
  /** Positive means person B owes person A */
  netOwed: number
  owedBy: 'personA' | 'personB' | 'balanced'
  owedAmount: number
}

export interface PeriodSummary {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  expensesByCategory: { categoryId: string; categoryName: string; color?: string; total: number }[]
}

export interface MovementFormData {
  type: MovementType
  amount: number
  currency: CurrencyCode
  date: string
  description: string
  categoryId: string | null
  paidBy: Payer
  sharePersonA: number
  sharePersonB: number
  isShared: boolean
}

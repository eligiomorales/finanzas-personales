export type ExpenseViewMode = 'couple' | 'personal'

const STORAGE_KEY = 'finanzas-expense-view-mode'

export function readExpenseViewMode(): ExpenseViewMode {
  if (typeof window === 'undefined') return 'couple'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'personal' ? 'personal' : 'couple'
}

export function writeExpenseViewMode(mode: ExpenseViewMode): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, mode)
}

export function expenseViewModeLabel(mode: ExpenseViewMode): string {
  return mode === 'personal' ? 'Personal' : 'Compartido'
}

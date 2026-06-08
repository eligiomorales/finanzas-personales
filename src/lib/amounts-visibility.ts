const STORAGE_KEY = 'finanzas-amounts-visible'

let snapshot = true
const listeners = new Set<() => void>()

export function subscribeAmountsVisibility(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

export function getAmountsVisible(): boolean {
  return snapshot
}

function emitAmountsVisibilityChange(): void {
  listeners.forEach((listener) => listener())
}

/** Sync in-memory flag used by formatCurrency (updated by AmountsVisibilityProvider). */
export function setAmountsVisibleRuntime(visible: boolean): void {
  if (snapshot === visible) return
  snapshot = visible
  emitAmountsVisibilityChange()
}

export function readAmountsVisible(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(STORAGE_KEY) !== 'false'
}

export function writeAmountsVisible(visible: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, visible ? 'true' : 'false')
}

/** Replace numeric part of a formatted currency string with a literal mask. */
export function maskFormattedAmount(formatted: string): string {
  const symbol = formatted.replace(/[\d\s.,]/g, '').trim() || '$'
  return `${symbol} **`
}

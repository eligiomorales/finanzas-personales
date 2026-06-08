import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAmountsVisible,
  maskFormattedAmount,
  readAmountsVisible,
  setAmountsVisibleRuntime,
  subscribeAmountsVisibility,
  writeAmountsVisible,
} from '@/lib/amounts-visibility'
import { formatCurrency } from '@/lib/utils'

const STORAGE_KEY = 'finanzas-amounts-visible'

function createStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
  }
}

describe('amounts visibility', () => {
  beforeEach(() => {
    const storage = createStorageMock()
    vi.stubGlobal('window', { localStorage: storage })
    setAmountsVisibleRuntime(true)
  })

  it('defaults to visible when storage is empty', () => {
    expect(readAmountsVisible()).toBe(true)
    expect(getAmountsVisible()).toBe(true)
  })

  it('persists hidden preference', () => {
    writeAmountsVisible(false)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false')
    expect(readAmountsVisible()).toBe(false)
  })

  it('masks formatted amounts with currency symbol and **', () => {
    expect(maskFormattedAmount('$ 842.300')).toBe('$ **')
    expect(maskFormattedAmount('US$ 12,50')).toBe('US$ **')
    expect(maskFormattedAmount('-$ 1.234')).toBe('-$ **')
  })

  it('masks formatCurrency when runtime visibility is off', () => {
    setAmountsVisibleRuntime(false)
    const masked = formatCurrency(842300, 'ARS')
    expect(masked).toContain('**')
    expect(masked).not.toContain('842')
  })

  it('shows formatCurrency when forced visible', () => {
    setAmountsVisibleRuntime(false)
    const shown = formatCurrency(15000, 'ARS', { visible: true })
    expect(shown).toContain('15')
    expect(shown).not.toContain('**')
  })

  it('notifies subscribers when visibility changes', () => {
    const seen: boolean[] = []
    const unsubscribe = subscribeAmountsVisibility(() => {
      seen.push(getAmountsVisible())
    })

    setAmountsVisibleRuntime(false)
    setAmountsVisibleRuntime(false)
    setAmountsVisibleRuntime(true)

    unsubscribe()
    expect(seen).toEqual([false, true])
  })
})

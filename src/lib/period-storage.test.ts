import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readStoredPeriod, writeStoredPeriod } from '@/lib/period-storage'

const STORAGE_KEY = 'finanzas-period'

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

describe('period storage', () => {
  beforeEach(() => {
    const storage = createStorageMock()
    vi.stubGlobal('window', { localStorage: storage })
  })

  it('returns current month when storage is empty', () => {
    const period = readStoredPeriod()
    expect(period.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(period.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(period.from <= period.to).toBe(true)
  })

  it('persists and reads a valid range', () => {
    writeStoredPeriod({ from: '2026-05-01', to: '2026-05-31' })
    expect(readStoredPeriod()).toEqual({ from: '2026-05-01', to: '2026-05-31' })
  })

  it('ignores corrupt storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    expect(readStoredPeriod().from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('ignores invalid date values', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ from: 'bad', to: '2026-05-31' }))
    expect(readStoredPeriod().from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

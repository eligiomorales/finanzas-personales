import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { activePeriodPresetId, PERIOD_PRESETS } from '@/lib/period-presets'
import { currentMonthRange, previousMonthRange } from '@/lib/utils'

describe('period presets', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('detects current month preset', () => {
    const range = currentMonthRange(new Date('2026-05-15'))
    expect(activePeriodPresetId(range)).toBe('current_month')
  })

  it('detects previous month preset', () => {
    const range = previousMonthRange(new Date('2026-05-15'))
    expect(activePeriodPresetId(range)).toBe('previous_month')
  })

  it('returns null for custom range', () => {
    expect(activePeriodPresetId({ from: '2020-01-01', to: '2020-01-31' })).toBeNull()
  })

  it('exposes three presets', () => {
    expect(PERIOD_PRESETS).toHaveLength(3)
  })
})

import { describe, expect, it } from 'vitest'
import { shouldFocusAmountFromNavigation } from '@/lib/movement-form-focus'

describe('movement-form-focus', () => {
  it('detects focus intent from router state', () => {
    expect(shouldFocusAmountFromNavigation({ focusAmount: true })).toBe(true)
    expect(shouldFocusAmountFromNavigation({})).toBe(false)
    expect(shouldFocusAmountFromNavigation(null)).toBe(false)
  })
})

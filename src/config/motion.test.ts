import { describe, it, expect } from 'vitest'
import { isMotionEnabled, shouldAnimate } from '@/config/motion'

describe('isMotionEnabled', () => {
  it('defaults to true when env var is unset', () => {
    expect(isMotionEnabled({})).toBe(true)
  })

  it('returns true when explicitly enabled', () => {
    expect(isMotionEnabled({ VITE_ANIMATIONS_ENABLED: 'true' })).toBe(true)
  })

  it('returns false only when set to "false"', () => {
    expect(isMotionEnabled({ VITE_ANIMATIONS_ENABLED: 'false' })).toBe(false)
  })
})

describe('shouldAnimate', () => {
  it('is true when motion is enabled and user does not prefer reduced motion', () => {
    expect(shouldAnimate(true, false)).toBe(true)
  })

  it('is false when user prefers reduced motion', () => {
    expect(shouldAnimate(true, true)).toBe(false)
  })

  it('is false when motion is disabled via feature flag', () => {
    expect(shouldAnimate(false, false)).toBe(false)
  })
})

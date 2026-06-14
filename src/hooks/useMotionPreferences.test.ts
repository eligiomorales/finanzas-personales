/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { useMotionPreferences, resetMotionPreferencesStoreForTests } from '@/hooks/useMotionPreferences'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function renderPreferences() {
  let prefs: ReturnType<typeof useMotionPreferences> | undefined

  function Probe() {
    prefs = useMotionPreferences()
    return null
  }

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(createElement(Probe))
  })

  return {
    get prefs() {
      if (!prefs) throw new Error('Hook did not run')
      return prefs
    },
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

describe('useMotionPreferences', () => {
  beforeEach(() => {
    resetMotionPreferencesStoreForTests()
    vi.stubEnv('VITE_ANIMATIONS_ENABLED', 'true')
    mockMatchMedia(false)
  })

  afterEach(() => {
    resetMotionPreferencesStoreForTests()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns shouldAnimate true when motion is enabled and reduced motion is off', () => {
    const view = renderPreferences()
    expect(view.prefs.motionEnabled).toBe(true)
    expect(view.prefs.prefersReducedMotion).toBe(false)
    expect(view.prefs.shouldAnimate).toBe(true)
    view.unmount()
  })

  it('returns shouldAnimate false when user prefers reduced motion', () => {
    mockMatchMedia(true)
    const view = renderPreferences()
    expect(view.prefs.prefersReducedMotion).toBe(true)
    expect(view.prefs.shouldAnimate).toBe(false)
    view.unmount()
  })

  it('returns shouldAnimate false when VITE_ANIMATIONS_ENABLED is false', () => {
    vi.stubEnv('VITE_ANIMATIONS_ENABLED', 'false')
    const view = renderPreferences()
    expect(view.prefs.motionEnabled).toBe(false)
    expect(view.prefs.shouldAnimate).toBe(false)
    view.unmount()
  })
})

import { useSyncExternalStore } from 'react'
import { isMotionEnabled, shouldAnimate as computeShouldAnimate } from '@/config/motion'

interface MotionPreferences {
  prefersReducedMotion: boolean
  motionEnabled: boolean
  shouldAnimate: boolean
}

type Listener = () => void

const listeners = new Set<Listener>()
let prefersReducedMotion = false
let mediaQueryListenerAttached = false

let cachedSnapshot: MotionPreferences = buildSnapshot()

function buildSnapshot(): MotionPreferences {
  const motionEnabled = isMotionEnabled()
  return {
    prefersReducedMotion,
    motionEnabled,
    shouldAnimate: computeShouldAnimate(motionEnabled, prefersReducedMotion),
  }
}

function syncPrefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getSnapshot(): MotionPreferences {
  syncPrefersReducedMotion()
  const next = buildSnapshot()
  if (
    cachedSnapshot.prefersReducedMotion === next.prefersReducedMotion &&
    cachedSnapshot.motionEnabled === next.motionEnabled &&
    cachedSnapshot.shouldAnimate === next.shouldAnimate
  ) {
    return cachedSnapshot
  }
  cachedSnapshot = next
  return cachedSnapshot
}

function getServerSnapshot(): MotionPreferences {
  const motionEnabled = isMotionEnabled()
  return {
    prefersReducedMotion: false,
    motionEnabled,
    shouldAnimate: computeShouldAnimate(motionEnabled, false),
  }
}

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function attachMediaQueryListener() {
  if (mediaQueryListenerAttached || typeof window === 'undefined') return
  mediaQueryListenerAttached = true

  syncPrefersReducedMotion()
  cachedSnapshot = buildSnapshot()

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', (event) => {
    prefersReducedMotion = event.matches
    cachedSnapshot = buildSnapshot()
    notifyListeners()
  })
}

function subscribe(listener: Listener) {
  attachMediaQueryListener()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useMotionPreferences = (): MotionPreferences => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Solo para tests: resetea el store singleton. */
export function resetMotionPreferencesStoreForTests() {
  prefersReducedMotion = false
  mediaQueryListenerAttached = false
  listeners.clear()
  cachedSnapshot = buildSnapshot()
}

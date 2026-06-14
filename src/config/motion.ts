/**
 * Feature flag y helpers de motion (lectura centralizada de env).
 */

type MotionEnv = Pick<ImportMetaEnv, 'VITE_ANIMATIONS_ENABLED'>

export function isMotionEnabled(env: MotionEnv = import.meta.env): boolean {
  return env.VITE_ANIMATIONS_ENABLED !== 'false'
}

export function shouldAnimate(
  motionEnabled: boolean,
  prefersReducedMotion: boolean,
): boolean {
  return motionEnabled && !prefersReducedMotion
}

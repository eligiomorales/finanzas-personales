import { type ReactNode, useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

/** Syncs motion prefs to Framer Motion + `html[data-reduce-motion]` for CSS fallbacks. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const { shouldAnimate } = useMotionPreferences()

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = shouldAnimate ? 'false' : 'true'
  }, [shouldAnimate])

  return (
    <MotionConfig reducedMotion={shouldAnimate ? 'user' : 'always'}>
      {children}
    </MotionConfig>
  )
}

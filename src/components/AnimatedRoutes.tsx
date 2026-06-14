import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { motionVariants } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

interface AnimatedRoutesProps {
  /** Remount key for amounts visibility — must not trigger page transition. */
  outletKey: string
}

export function AnimatedRoutes({ outletKey }: AnimatedRoutesProps) {
  const location = useLocation()
  const { shouldAnimate } = useMotionPreferences()

  const outlet = <Outlet key={outletKey} />

  if (!shouldAnimate) {
    return outlet
  }

  return (
    <LayoutGroup>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={location.pathname}
          variants={motionVariants.slideUp}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {outlet}
        </motion.div>
      </AnimatePresence>
    </LayoutGroup>
  )
}

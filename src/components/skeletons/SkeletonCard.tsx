import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { motionTransitions, motionVariants } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { cn } from '@/lib/utils'

const shimmerClassName =
  'bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 bg-[length:200%_100%]'

export function SkeletonBar({ className }: { className?: string }) {
  const { shouldAnimate } = useMotionPreferences()

  if (!shouldAnimate) {
    return <div className={cn('rounded-md bg-stone-200/90', className)} aria-hidden="true" />
  }

  return (
    <motion.div
      className={cn('rounded-md', shimmerClassName, className)}
      variants={motionVariants.shimmer}
      initial="initial"
      animate="animate"
      transition={motionTransitions.shimmer}
      aria-hidden="true"
    />
  )
}

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando formulario">
      <Card compact className={className}>
      <div className="space-y-3">
        <div>
          <SkeletonBar className="mb-1.5 h-3.5 w-12" />
          <div className="grid grid-cols-3 gap-2">
            <SkeletonBar className="col-span-2 h-11" />
            <SkeletonBar className="h-11" />
          </div>
        </div>

        <div>
          <SkeletonBar className="mb-1.5 h-3.5 w-16" />
          <SkeletonBar className="h-11" />
        </div>

        <div>
          <SkeletonBar className="mb-1.5 h-3.5 w-20" />
          <div className="flex flex-wrap gap-2">
            <SkeletonBar className="h-8 w-20 rounded-full" />
            <SkeletonBar className="h-8 w-24 rounded-full" />
            <SkeletonBar className="h-8 w-16 rounded-full" />
          </div>
        </div>

        <div>
          <SkeletonBar className="mb-1.5 h-3.5 w-12" />
          <SkeletonBar className="h-11" />
        </div>

        <div className="mt-4 flex gap-2">
          <SkeletonBar className="h-10 flex-1" />
          <SkeletonBar className="h-10 w-24" />
        </div>
      </div>
    </Card>
    </div>
  )
}

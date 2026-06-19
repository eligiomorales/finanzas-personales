import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ButtonLink } from '@/components/ui/TextLink'
import { cn } from '@/lib/utils'
import { cardSurface } from '@/components/ui/styles'
import { getTapMotionProps } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

interface CardProps {
  children: ReactNode
  className?: string
  id?: string
  onClick?: () => void
  compact?: boolean
}

const MotionDiv = motion.div

export function Card({ children, className, id, onClick, compact }: CardProps) {
  const { shouldAnimate } = useMotionPreferences()
  const isClickable = Boolean(onClick)
  const tapMotion = isClickable && shouldAnimate ? getTapMotionProps(true) : {}
  const classes = cn(
    cardSurface,
    compact ? 'p-3' : 'p-4',
    isClickable && 'cursor-pointer hover:shadow-elevated',
    className,
  )

  if (isClickable && shouldAnimate) {
    return (
      <MotionDiv
        id={id}
        className={classes}
        onClick={onClick}
        whileTap={tapMotion.whileTap}
        transition={tapMotion.transition}
      >
        {children}
      </MotionDiv>
    )
  }

  return (
    <div id={id} className={classes} onClick={onClick}>
      {children}
    </div>
  )
}

export { MetricCard, StatCard } from '@/components/ui/MetricCard'

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: { label: string; to: string; variant?: 'primary' | 'secondary' }[]
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600"
        aria-hidden="true"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="font-semibold text-stone-700">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-stone-500">{description}</p>
      {actions && actions.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <ButtonLink
              key={action.to + action.label}
              to={action.to}
              variant={action.variant === 'secondary' ? 'secondary' : 'primary'}
              size="sm"
            >
              {action.label}
            </ButtonLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const colors = {
    default: 'bg-stone-100 text-stone-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-brand-50 text-brand-700',
  }
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', colors[variant])}>
      {children}
    </span>
  )
}

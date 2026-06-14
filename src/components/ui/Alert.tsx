import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { motionTransitions } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { cn } from '@/lib/utils'

export type AlertTone = 'info' | 'warning' | 'success' | 'error'

const toneStyles: Record<
  AlertTone,
  { container: string; title: string; description: string; icon: string }
> = {
  info: {
    container: 'border-brand-200 bg-brand-50',
    title: 'text-brand-900',
    description: 'text-brand-800',
    icon: 'text-brand-600',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    title: 'text-amber-900',
    description: 'text-amber-800',
    icon: 'text-amber-600',
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50',
    title: 'text-emerald-900',
    description: 'text-emerald-800',
    icon: 'text-emerald-600',
  },
  error: {
    container: 'border-red-200 bg-red-50',
    title: 'text-red-900',
    description: 'text-red-800',
    icon: 'text-red-600',
  },
}

function AlertIcon({ tone }: { tone: AlertTone }) {
  const className = cn('mt-0.5 h-5 w-5 shrink-0', toneStyles[tone].icon)
  if (tone === 'success') {
    return (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    )
  }
  if (tone === 'error') {
    return (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function Alert({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: AlertTone
  title?: string
  children: ReactNode
  action?: { label: string; onClick?: () => void; to?: string }
  className?: string
}) {
  const { shouldAnimate } = useMotionPreferences()
  const styles = toneStyles[tone]
  const role = tone === 'error' || tone === 'warning' ? 'alert' : 'status'

  const content = (
    <>
      <AlertIcon tone={tone} />
      <div className="min-w-0 flex-1">
        {title && <p className={cn('font-semibold', styles.title)}>{title}</p>}
        <div className={cn('text-sm leading-relaxed', title ? 'mt-1' : '', styles.description)}>
          {children}
        </div>
        {action && (
          <div className="mt-3">
            {action.to ? (
              <Link
                to={action.to}
                className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )

  if (!shouldAnimate) {
    return (
      <div
        role={role}
        className={cn('flex gap-3 rounded-xl border p-4', styles.container, className)}
      >
        {content}
      </div>
    )
  }

  return (
    <motion.div
      role={role}
      className={cn('flex gap-3 rounded-xl border p-4', styles.container, className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={motionTransitions.microInteraction}
    >
      {content}
    </motion.div>
  )
}

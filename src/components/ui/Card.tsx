import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  id?: string
  onClick?: () => void
  compact?: boolean
}

export function Card({ children, className, id, onClick, compact }: CardProps) {
  return (
    <div
      id={id}
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        compact ? 'p-3' : 'p-4',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  variant = 'default',
  delta,
}: {
  label: string
  value: string
  variant?: 'default' | 'income' | 'expense' | 'neutral'
  delta?: { text: string; tone: 'positive' | 'negative' | 'neutral' }
}) {
  const colors = {
    default: 'text-slate-900',
    income: 'text-emerald-700',
    expense: 'text-red-700',
    neutral: 'text-blue-700',
  }

  const deltaColors = {
    positive: 'text-emerald-700',
    negative: 'text-red-700',
    neutral: 'text-slate-500',
  }

  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className={cn('text-xl font-bold tabular-nums', colors[variant])}>{value}</span>
      {delta && (
        <span className={cn('text-xs font-medium', deltaColors[delta.tone])}>{delta.text}</span>
      )}
    </Card>
  )
}

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
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
        📊
      </div>
      <h3 className="font-semibold text-slate-700">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p>
      {actions && actions.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <Link
              key={action.to + action.label}
              to={action.to}
              className={cn(
                'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                action.variant === 'secondary'
                  ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  : 'bg-brand-600 text-white hover:bg-brand-700',
              )}
            >
              {action.label}
            </Link>
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
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  }
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', colors[variant])}>
      {children}
    </span>
  )
}

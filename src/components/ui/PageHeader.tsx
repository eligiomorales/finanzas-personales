import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { textMuted } from '@/components/ui/styles'

interface PageHeaderProps {
  title: string
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, leading, trailing, children, className }: PageHeaderProps) {
  return (
    <div className={cn('-mx-4 space-y-2 border-b border-stone-200/80 bg-surface-50 px-4 pb-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {leading}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold tracking-tight text-stone-900">{title}</h2>
            {subtitle && <p className={cn('mt-0.5 text-xs', textMuted)}>{subtitle}</p>}
          </div>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  )
}

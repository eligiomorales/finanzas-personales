import { Link, type LinkProps } from 'react-router-dom'
import { type ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { focusRing, textMuted } from '@/components/ui/styles'

interface SettingsListProps {
  title?: string
  children: ReactNode
}

interface SettingsListItemProps extends Omit<LinkProps, 'className'> {
  label: string
  description?: string
  meta?: ReactNode
  className?: string
}

export function SettingsList({ title, children }: SettingsListProps) {
  return (
    <section className="space-y-2">
      {title && <h3 className="px-1 text-sm font-semibold text-stone-900">{title}</h3>}
      <Card compact className="divide-y divide-stone-200/80 p-0">
        {children}
      </Card>
    </section>
  )
}

export function SettingsListItem({
  label,
  description,
  meta,
  className,
  children,
  ...props
}: SettingsListItemProps) {
  return (
    <Link
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-surface-50',
        focusRing,
        className,
      )}
      {...props}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-stone-900">{label}</span>
        {description && <span className={cn('mt-0.5 block text-xs', textMuted)}>{description}</span>}
        {children}
      </span>
      <span className="flex shrink-0 items-center gap-2 text-sm text-stone-400">
        {meta}
        <span aria-hidden="true">&gt;</span>
      </span>
    </Link>
  )
}

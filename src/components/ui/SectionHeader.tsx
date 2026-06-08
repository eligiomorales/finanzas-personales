import { type ReactNode } from 'react'
import { TextLink } from '@/components/ui/TextLink'
import { cn } from '@/lib/utils'
import { textMuted } from '@/components/ui/styles'

interface SectionHeaderProps {
  label: string
  action?: { label: string; to: string }
  className?: string
  children?: ReactNode
}

export function SectionHeader({ label, action, className, children }: SectionHeaderProps) {
  return (
    <div className={cn('mb-2 flex items-center justify-between gap-3', className)}>
      <p className={cn('text-xs font-semibold uppercase tracking-wide', textMuted)}>{label}</p>
      {action ? (
        <TextLink to={action.to} className="shrink-0 text-xs">
          {action.label}
        </TextLink>
      ) : (
        children
      )}
    </div>
  )
}

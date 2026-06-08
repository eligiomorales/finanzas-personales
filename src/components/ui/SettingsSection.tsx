import { type ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { textSecondary } from '@/components/ui/styles'

interface SettingsSectionProps {
  title: string
  description?: ReactNode
  children: ReactNode
  tone?: 'default' | 'danger'
  className?: string
  id?: string
}

export function SettingsSection({
  title,
  description,
  children,
  tone = 'default',
  className,
  id,
}: SettingsSectionProps) {
  return (
    <Card id={id} className={cn(tone === 'danger' && 'border-red-200', className)}>
      <h3
        className={cn(
          'font-semibold',
          description ? 'mb-2' : 'mb-4',
          tone === 'danger' ? 'text-red-700' : 'text-stone-900',
        )}
      >
        {title}
      </h3>
      {description && <p className={cn('mb-4 text-sm', textSecondary)}>{description}</p>}
      {children}
    </Card>
  )
}

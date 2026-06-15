import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useRegisterLayoutHeader } from '@/contexts/LayoutHeaderContext'

interface PageHeaderProps {
  title: string
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  leading,
  trailing,
  children,
  className,
}: PageHeaderProps) {
  useRegisterLayoutHeader({ title, subtitle, leading, toolbar: children })

  if (!trailing) return null

  return <div className={cn('flex justify-end', className)}>{trailing}</div>
}

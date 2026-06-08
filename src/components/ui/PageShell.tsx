import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('flex min-h-dvh items-center justify-center bg-surface-50 px-4', className)}>
      {children}
    </div>
  )
}

export function LoadingState({ message = 'Cargando…' }: { message?: string }) {
  return (
    <PageShell>
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
          aria-hidden="true"
        />
        <p className="text-sm text-stone-500">{message}</p>
      </div>
    </PageShell>
  )
}

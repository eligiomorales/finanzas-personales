import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { focusRing } from '@/components/ui/styles'

interface CollapsiblePanelProps {
  title: string
  summary?: string
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  panelId?: string
  compact?: boolean
  className?: string
  contentClassName?: string
}

export function CollapsiblePanel({
  title,
  summary,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  panelId: panelIdProp,
  compact = false,
  className,
  contentClassName,
}: CollapsiblePanelProps) {
  const generatedId = useId()
  const panelId = panelIdProp ?? `collapsible-${generatedId}`
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = openProp ?? internalOpen

  function setOpen(nextOpen: boolean) {
    onOpenChange?.(nextOpen)
    if (openProp === undefined) setInternalOpen(nextOpen)
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border border-stone-200 bg-surface-50 text-left transition-colors hover:bg-surface-100',
          focusRing,
          compact ? 'px-2.5 py-2' : 'gap-3 px-3 py-3',
        )}
      >
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-stone-800">{title}</span>
          {summary && (
            <span
              className={cn(
                'mt-0.5 block text-xs text-stone-500',
                compact && 'truncate',
              )}
            >
              {summary}
            </span>
          )}
        </div>
        <span className="shrink-0 text-stone-400" aria-hidden="true">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          className={cn(
            'rounded-lg border border-stone-200',
            compact ? 'mt-1.5 p-2.5' : 'mt-3 p-3',
            contentClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

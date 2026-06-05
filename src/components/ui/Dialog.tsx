import { useEffect, useId, type ReactNode } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  titleId?: string
  description?: string
  descriptionId?: string
  children: ReactNode
  className?: string
  closeOnBackdrop?: boolean
}

export function Dialog({
  open,
  onClose,
  title,
  titleId,
  description,
  descriptionId,
  children,
  className,
  closeOnBackdrop = true,
}: DialogProps) {
  const generatedTitleId = useId()
  const generatedDescriptionId = useId()
  const resolvedTitleId = titleId ?? generatedTitleId
  const resolvedDescriptionId = descriptionId ?? generatedDescriptionId
  const trapRef = useFocusTrap(open)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center">
      {closeOnBackdrop ? (
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          aria-label="Cerrar diálogo"
          onClick={onClose}
        />
      ) : (
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      )}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        aria-describedby={description ? resolvedDescriptionId : undefined}
        className={cn(
          'relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-lg',
          className,
        )}
      >
        <h3 id={resolvedTitleId} className="text-lg font-bold text-slate-900">
          {title}
        </h3>
        {description && (
          <p id={resolvedDescriptionId} className="mt-2 text-sm text-slate-600">
            {description}
          </p>
        )}
        <div className={description ? 'mt-4' : 'mt-4'}>{children}</div>
      </div>
    </div>
  )
}

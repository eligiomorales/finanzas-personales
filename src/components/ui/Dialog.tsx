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
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
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
          'relative w-full max-w-md rounded-t-2xl border border-b-0 border-stone-200/80 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-xl shadow-stone-300/20 md:rounded-2xl md:border-b md:pb-5',
          className,
        )}
      >
        <h3 id={resolvedTitleId} className="text-lg font-bold tracking-tight text-stone-900">
          {title}
        </h3>
        {description && (
          <p id={resolvedDescriptionId} className="mt-2 text-sm text-stone-600">
            {description}
          </p>
        )}
        <div className={description ? 'mt-4' : 'mt-3'}>{children}</div>
      </div>
    </div>
  )
}

import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Form'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      closeOnBackdrop={!loading}
    >
      <div className="flex gap-3">
        <Button
          type="button"
          variant={variant === 'danger' ? 'danger' : 'primary'}
          className="flex-1"
          disabled={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button type="button" variant="secondary" className="flex-1" disabled={loading} onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Dialog>
  )
}

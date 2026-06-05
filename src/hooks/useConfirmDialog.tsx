import { useCallback, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
}

interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setState((current) => {
      current?.resolve(true)
      return null
    })
  }, [])

  const handleCancel = useCallback(() => {
    setState((current) => {
      current?.resolve(false)
      return null
    })
  }, [])

  const dialog = state ? (
    <ConfirmDialog
      open
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null

  return { confirm, dialog }
}

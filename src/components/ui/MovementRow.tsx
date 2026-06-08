import { type ReactNode } from 'react'
import { Badge, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Form'
import { ButtonLink } from '@/components/ui/TextLink'
import { textMuted } from '@/components/ui/styles'
import { cn, movementAmountColor, movementTypeColor, movementTypeLabel } from '@/lib/utils'
import type { Movement } from '@/types'

interface MovementAmountProps {
  type: Movement['type']
  sign?: string
  primary: string
  secondary?: string
  size?: 'sm' | 'md'
}

function MovementAmount({ type, sign = '', primary, secondary, size = 'md' }: MovementAmountProps) {
  return (
    <div className="shrink-0 text-right">
      <p
        className={cn(
          'font-bold tabular-nums',
          movementAmountColor(type),
          size === 'sm' ? 'text-sm font-semibold' : 'text-sm sm:text-base',
        )}
      >
        {sign}
        {primary}
      </p>
      {secondary && <p className="text-xs tabular-nums text-stone-500">{secondary}</p>}
    </div>
  )
}

export function MovementList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card compact className={cn('divide-y divide-stone-100 p-0', className)}>
      {children}
    </Card>
  )
}

interface MovementRowCompactProps {
  variant: 'compact'
  description: string
  categoryName?: string
  movementType: Movement['type']
  amount: string
  amountSign?: string
  className?: string
}

interface MovementRowDetailedProps {
  variant?: 'detailed'
  description: string
  date: string
  movementType: Movement['type']
  amountPrimary: string
  amountSecondary?: string
  amountSign?: string
  categoryName?: string
  payerLabel?: string
  sharingLabel?: string
  imported?: boolean
  editTo?: string
  onDelete?: () => void
  deleting?: boolean
  layout?: 'list' | 'card'
  className?: string
}

export type MovementRowProps = MovementRowCompactProps | MovementRowDetailedProps

export function MovementRow(props: MovementRowProps) {
  if (props.variant === 'compact') {
    const { description, categoryName, movementType, amount, amountSign, className } = props
    return (
      <div className={cn('flex items-center gap-3 px-4 py-3', className)}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">{description}</p>
          {categoryName && <p className={cn('mt-0.5 truncate text-xs', textMuted)}>{categoryName}</p>}
        </div>
        <MovementAmount
          type={movementType}
          sign={amountSign}
          primary={amount}
          size="sm"
        />
      </div>
    )
  }

  const {
    description,
    date,
    movementType,
    amountPrimary,
    amountSecondary,
    amountSign,
    categoryName,
    payerLabel,
    sharingLabel,
    imported,
    editTo,
    onDelete,
    deleting,
    layout = 'list',
    className,
  } = props

  const row = (
    <div className={cn(layout === 'list' ? 'space-y-2 px-4 py-3' : 'space-y-2', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-500">{date}</span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-xs font-medium',
                movementTypeColor(movementType),
              )}
            >
              {movementTypeLabel(movementType)}
            </span>
            {imported && <Badge variant="info">Importado</Badge>}
          </div>
          <p className="mt-1 break-words font-medium text-stone-800">{description}</p>
        </div>
        <MovementAmount
          type={movementType}
          sign={amountSign}
          primary={amountPrimary}
          secondary={amountSecondary}
        />
      </div>
      {(categoryName || payerLabel || sharingLabel || editTo || onDelete) && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className={cn('flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-xs', textMuted)}>
            {categoryName && <span>{categoryName}</span>}
            {payerLabel && (
              <span>
                {categoryName ? '· ' : ''}
                Pagó: {payerLabel}
              </span>
            )}
            {sharingLabel && (
              <span>
                {(categoryName || payerLabel) ? '· ' : ''}
                {sharingLabel}
              </span>
            )}
          </div>
          {(editTo || onDelete) && (
            <div className="ml-auto flex shrink-0 gap-1">
              {editTo && (
                <ButtonLink to={editTo} size="sm" variant="ghost">
                  Editar
                </ButtonLink>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700"
                  disabled={deleting}
                  aria-busy={deleting}
                  onClick={onDelete}
                >
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (layout === 'card') {
    return <Card className="!p-3">{row}</Card>
  }

  return row
}

import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CategoryAvatar } from '@/components/CategoryAvatar'
import { Badge, Card } from '@/components/ui/Card'
import { focusRing, textMuted } from '@/components/ui/styles'
import { getLayoutTransition } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { cn, movementAmountColor, movementTypeColor, movementTypeLabel } from '@/lib/utils'
import type { Movement } from '@/types'

export function movementLayoutId(id: string) {
  return `movement-${id}`
}

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
          size === 'sm' ? 'text-sm font-semibold' : 'text-sm',
        )}
      >
        {sign}
        {primary}
      </p>
      {secondary && <p className="text-xs tabular-nums text-stone-500">{secondary}</p>}
    </div>
  )
}

export interface MovementSummaryBlockProps {
  description: string
  date: string
  movementType: Movement['type']
  amountPrimary: string
  amountSecondary?: string
  amountSign?: string
  imported?: boolean
  layoutId?: string
}

export function MovementSummaryBlock({
  description,
  date,
  movementType,
  amountPrimary,
  amountSecondary,
  amountSign,
  imported,
  layoutId,
}: MovementSummaryBlockProps) {
  const { shouldAnimate } = useMotionPreferences()
  const layoutTransition = getLayoutTransition(shouldAnimate)

  const content = (
    <div className="flex items-start justify-between gap-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs leading-5">
          <span className="text-stone-500">{date}</span>
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
        <p className="mt-0.5 break-words text-sm font-medium leading-5 text-stone-800">
          {description}
        </p>
      </div>
      <MovementAmount
        type={movementType}
        sign={amountSign}
        primary={amountPrimary}
        secondary={amountSecondary}
      />
    </div>
  )

  if (layoutId && shouldAnimate) {
    return (
      <motion.div layoutId={layoutId} transition={layoutTransition}>
        {content}
      </motion.div>
    )
  }

  return content
}

export function MovementList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card compact className={cn('space-y-[5px] p-0 [&>*+*]:border-t [&>*+*]:border-stone-200/70', className)}>
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

interface MovementRowGroupedCardProps {
  variant: 'grouped-card'
  to: string
  movementId?: string
  categoryName: string
  categoryColor?: string
  description: string
  payerLabel?: string
  hidePayerPill?: boolean
  movementType: Movement['type']
  amountPrimary: string
  amountSecondary?: string
  amountSign?: string
  isShared?: boolean
  className?: string
}

export type MovementRowProps = MovementRowCompactProps | MovementRowGroupedCardProps

export function MovementRow(props: MovementRowProps) {
  if (props.variant === 'compact') {
    const { description, categoryName, movementType, amount, amountSign, className } = props
    return (
      <div className={cn('flex items-center gap-3 px-4 py-2.5', className)}>
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
    to,
    movementId,
    categoryName,
    categoryColor,
    description,
    payerLabel,
    hidePayerPill,
    movementType,
    amountPrimary,
    amountSecondary,
    amountSign,
    isShared,
    className,
  } = props

  const { shouldAnimate } = useMotionPreferences()
  const layoutTransition = getLayoutTransition(shouldAnimate)
  const showPayerPill = Boolean(payerLabel) && !hidePayerPill

  const card = (
    <Card compact className={cn('!p-3 transition-colors hover:bg-surface-50', className)}>
      <div className="flex min-h-12 items-center gap-3">
        <CategoryAvatar name={categoryName} color={categoryColor} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold text-stone-800">{categoryName}</p>
            {showPayerPill && (
              <Badge variant="default">
                <span className="max-w-[8rem] truncate" title={payerLabel}>
                  {payerLabel}
                </span>
              </Badge>
            )}
            {isShared !== undefined && (
              <Badge variant={isShared ? 'info' : 'default'}>
                {isShared ? 'Compartido' : 'Personal'}
              </Badge>
            )}
          </div>
          <p className={cn('mt-0.5 truncate text-xs', textMuted)}>{description}</p>
        </div>
        <MovementAmount
          type={movementType}
          sign={amountSign}
          primary={amountPrimary}
          secondary={amountSecondary}
        />
      </div>
    </Card>
  )

  const linkLabel = `${categoryName}, ${description}, ${amountSign}${amountPrimary}`

  if (movementId && shouldAnimate) {
    return (
      <Link
        to={to}
        aria-label={`Editar movimiento: ${linkLabel}`}
        className={cn('block rounded-xl', focusRing)}
      >
        <motion.div layoutId={movementLayoutId(movementId)} transition={layoutTransition}>
          {card}
        </motion.div>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      aria-label={`Editar movimiento: ${linkLabel}`}
      className={cn('block rounded-xl', focusRing)}
    >
      {card}
    </Link>
  )
}

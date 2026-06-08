import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { focusRing } from '@/components/ui/styles'

interface ChoiceChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  size?: 'sm' | 'md'
  shape?: 'default' | 'pill'
  align?: 'center' | 'start'
}

export function ChoiceChip({
  selected = false,
  size = 'md',
  shape = 'default',
  align = 'center',
  className,
  type = 'button',
  role,
  ...props
}: ChoiceChipProps) {
  const isRadio = role === 'radio'

  return (
    <button
      type={type}
      role={role}
      aria-pressed={isRadio ? undefined : selected}
      aria-checked={isRadio ? selected : undefined}
      className={cn(
        'border font-medium transition-colors',
        shape === 'pill' ? 'rounded-full' : 'rounded-lg',
        align === 'start' && 'text-left',
        focusRing,
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        selected
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-surface-50',
        className,
      )}
      {...props}
    />
  )
}

interface ChoiceChipGroupProps {
  children: ReactNode
  label: string
  labelId: string
  className?: string
  role?: 'group' | 'radiogroup'
}

export function ChoiceChipGroup({
  children,
  label,
  labelId,
  className,
  role = 'group',
}: ChoiceChipGroupProps) {
  return (
    <>
      <span id={labelId} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </span>
      <div role={role} aria-labelledby={labelId} className={className}>
        {children}
      </div>
    </>
  )
}

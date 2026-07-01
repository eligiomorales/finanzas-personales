import { type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { focusRing } from '@/components/ui/styles'
import { fieldFocusStyle, getTapMotionProps } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

interface ChoiceChipProps extends HTMLMotionProps<'button'> {
  selected?: boolean
  size?: 'sm' | 'md'
  shape?: 'default' | 'pill'
  align?: 'center' | 'start'
}

const MotionButton = motion.button

export function ChoiceChip({
  selected = false,
  size = 'md',
  shape = 'default',
  align = 'center',
  className,
  type = 'button',
  role,
  disabled,
  style,
  ...props
}: ChoiceChipProps) {
  const { shouldAnimate } = useMotionPreferences()
  const isRadio = role === 'radio'
  const tapMotion = shouldAnimate && !disabled ? getTapMotionProps(true) : {}

  return (
    <MotionButton
      type={type}
      role={role}
      disabled={disabled}
      aria-pressed={isRadio ? undefined : selected}
      aria-checked={isRadio ? selected : undefined}
      className={cn(
        'border font-medium',
        shape === 'pill' ? 'rounded-full' : 'rounded-lg',
        align === 'start' && 'text-left',
        focusRing,
        size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3 py-2 text-sm',
        selected
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-surface-50',
        shouldAnimate && 'transition-[border-color,background-color,color]',
        disabled && 'opacity-50',
        className,
      )}
      style={
        shouldAnimate
          ? {
              ...fieldFocusStyle,
              transitionProperty: 'border-color, background-color, color, box-shadow',
              ...style,
            }
          : style
      }
      whileTap={tapMotion.whileTap}
      transition={tapMotion.transition}
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

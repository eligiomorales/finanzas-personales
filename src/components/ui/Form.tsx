import {
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { focusRing, textMuted } from '@/components/ui/styles'
import { fieldFocusStyle, getMotionProps } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

export { focusRing }

const MotionButton = motion.button

export function describedBy(...ids: (string | false | undefined | null)[]): string | undefined {
  const value = ids.filter(Boolean).join(' ')
  return value || undefined
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: HTMLMotionProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}) {
  const { shouldAnimate } = useMotionPreferences()
  const buttonMotion = shouldAnimate && !disabled ? getMotionProps('button', true) : {}

  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700',
    secondary: 'border border-stone-300 bg-white text-stone-700 hover:bg-surface-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-stone-600 hover:bg-stone-100',
  }
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <MotionButton
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50',
        focusRing,
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      whileHover={buttonMotion.whileHover}
      whileTap={buttonMotion.whileTap}
      transition={buttonMotion.transition}
      {...props}
    />
  )
}

export function Input({
  className,
  invalid,
  type,
  style,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { shouldAnimate } = useMotionPreferences()

  return (
    <input
      type={type}
      aria-invalid={invalid || props['aria-invalid']}
      className={cn(
        'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none',
        'focus-visible:border-brand-500 focus-visible:shadow-[0_1px_2px_rgba(47,122,107,0.12)]',
        focusRing,
        invalid && 'border-red-400',
        type === 'date' && 'block min-w-0 max-w-full',
        className,
      )}
      style={shouldAnimate ? { ...fieldFocusStyle, ...style } : style}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  invalid,
  style,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  const { shouldAnimate } = useMotionPreferences()

  return (
    <select
      aria-invalid={invalid || props['aria-invalid']}
      className={cn(
        'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none',
        'focus-visible:border-brand-500 focus-visible:shadow-[0_1px_2px_rgba(47,122,107,0.12)]',
        focusRing,
        invalid && 'border-red-400',
        className,
      )}
      style={shouldAnimate ? { ...fieldFocusStyle, ...style } : style}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode
  htmlFor?: string
  className?: string
}) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1 block text-sm font-medium text-stone-700', className)}>
      {children}
    </label>
  )
}

export function FormGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {children}
    </p>
  )
}

export function FieldHint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className={cn('mt-1 text-xs', textMuted)}>
      {children}
    </p>
  )
}

export function StatusMessage({
  tone,
  children,
  id,
  className,
}: {
  tone: 'error' | 'success' | 'info'
  children: ReactNode
  id?: string
  className?: string
}) {
  const tones = {
    error: 'text-red-600',
    success: 'text-emerald-600',
    info: 'text-stone-600',
  }

  return (
    <p
      id={id}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={cn('text-sm', tones[tone], className)}
    >
      {children}
    </p>
  )
}

export function LiveRegion({
  children,
  politeness = 'polite',
  className,
}: {
  children: ReactNode
  politeness?: 'polite' | 'assertive'
  className?: string
}) {
  return (
    <div aria-live={politeness} aria-atomic="true" className={cn('sr-only', className)}>
      {children}
    </div>
  )
}

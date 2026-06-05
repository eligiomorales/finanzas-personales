import {
  type ButtonHTMLAttributes,
  type SelectHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

const focusRing =
  'focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:outline-none'

export function describedBy(...ids: (string | false | undefined | null)[]): string | undefined {
  const value = ids.filter(Boolean).join(' ')
  return value || undefined
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50',
        focusRing,
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function Input({
  className,
  invalid,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      type={type}
      aria-invalid={invalid || props['aria-invalid']}
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors',
        focusRing,
        invalid && 'border-red-400',
        type === 'date' && 'block min-w-0 max-w-full',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  invalid,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || props['aria-invalid']}
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none',
        focusRing,
        invalid && 'border-red-400',
        className,
      )}
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
    <label htmlFor={htmlFor} className={cn('mb-1 block text-sm font-medium text-slate-700', className)}>
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
    <p id={id} className="mt-1 text-xs text-slate-500">
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
    info: 'text-slate-600',
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

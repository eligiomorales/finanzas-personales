import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { focusRing } from '@/components/ui/styles'

interface TextLinkProps extends Omit<LinkProps, 'className'> {
  className?: string
  children: React.ReactNode
}

export function TextLink({ className, children, ...props }: TextLinkProps) {
  return (
    <Link
      className={cn(
        'font-medium text-brand-600 underline-offset-2 hover:text-brand-700 hover:underline',
        focusRing,
        'rounded-sm',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}

interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700',
    secondary: 'border border-stone-300 bg-white text-stone-700 hover:bg-surface-50',
    ghost: 'text-stone-600 hover:bg-stone-100',
  }
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        focusRing,
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}

import { NavLink } from 'react-router-dom'
import { useAmountsVisibility } from '@/contexts/AmountsVisibilityContext'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { getTapMotionProps } from '@/design/motion'
import { cn } from '@/lib/utils'
import { focusRing } from '@/components/ui/styles'
import { motion } from 'framer-motion'

const MotionButton = motion.button

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

export function EyeIcon({ visible, className }: { visible: boolean; className?: string }) {
  const props = {
    className: cn('h-5 w-5', className),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (visible) {
    return (
      <svg {...props}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx={12} cy={12} r={3} />
      </svg>
    )
  }

  return (
    <svg {...props}>
      <path d="M10.7 10.7a3 3 0 0 0 4.2 4.2M9.9 5.5A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-4.1 5.2M6.1 6.1C3.5 7.8 2 12 2 12a18.5 18.5 0 0 0 5.2 5.2M3 3l18 18" />
    </svg>
  )
}

type ChromeToolbarVariant = 'surface' | 'hero'

interface ChromeToolbarActionsProps {
  variant?: ChromeToolbarVariant
  showPersonalBadge?: boolean
}

export function ChromeToolbarActions({
  variant = 'surface',
  showPersonalBadge = false,
}: ChromeToolbarActionsProps) {
  const { shouldAnimate } = useMotionPreferences()
  const { visible: amountsVisible, toggle: toggleAmountsVisibility } = useAmountsVisibility()
  const tapMotion = getTapMotionProps(shouldAnimate)
  const isHero = variant === 'hero'

  const eyeClass = isHero
    ? cn(
        'text-white/90 hover:bg-white/10',
        !amountsVisible && 'bg-white/15 text-white',
      )
    : cn(
        amountsVisible
          ? 'text-stone-500 hover:bg-surface-100 hover:text-stone-700'
          : 'bg-brand-50 text-brand-600',
      )

  const settingsClass = isHero
    ? 'text-white/90 hover:bg-white/10'
    : ({ isActive }: { isActive: boolean }) =>
        isActive
          ? 'bg-brand-50 text-brand-600'
          : 'text-stone-500 hover:bg-surface-100 hover:text-stone-700'

  return (
    <div className="flex shrink-0 items-center gap-1">
      {showPersonalBadge && (
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            isHero ? 'bg-white/15 text-white' : 'bg-brand-100 text-brand-700',
          )}
        >
          Personal
        </span>
      )}
      <MotionButton
        type="button"
        onClick={toggleAmountsVisibility}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
          focusRing,
          eyeClass,
        )}
        aria-label={amountsVisible ? 'Ocultar montos' : 'Mostrar montos'}
        aria-pressed={!amountsVisible}
        {...tapMotion}
      >
        <EyeIcon visible={amountsVisible} />
      </MotionButton>
      <NavLink
        to="/configuracion"
        className={(state) =>
          cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
            focusRing,
            typeof settingsClass === 'function' ? settingsClass(state) : settingsClass,
          )
        }
        aria-label="Ajustes"
      >
        <SettingsIcon />
      </NavLink>
    </div>
  )
}

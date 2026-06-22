import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { focusRing } from '@/components/ui/styles'
import { getTapMotionProps, motionTransitions } from '@/design/motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
  /** Unique per instance — shared layoutId makes the selection indicator jump between controls. */
  indicatorLayoutId?: string
  className?: string
  size?: 'sm' | 'md'
  fullWidth?: boolean
}

const MotionButton = motion.button

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  indicatorLayoutId: indicatorLayoutIdProp,
  className,
  size = 'md',
  fullWidth = true,
}: SegmentedControlProps<T>) {
  const { shouldAnimate } = useMotionPreferences()
  const tapMotion = getTapMotionProps(shouldAnimate)
  const indicatorLayoutId =
    indicatorLayoutIdProp ?? `segmented-indicator-${ariaLabel.replace(/\s+/g, '-')}`

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'flex rounded-lg border border-stone-200 bg-surface-100 p-0.5',
        fullWidth && 'w-full',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <MotionButton
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              'relative rounded-md font-medium',
              focusRing,
              fullWidth && 'flex-1 min-w-0',
              size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm',
              selected ? 'text-brand-700' : 'text-stone-600 hover:text-stone-800',
            )}
            whileTap={tapMotion.whileTap}
            transition={tapMotion.transition}
          >
            {selected &&
              (shouldAnimate ? (
                <motion.span
                  layoutId={indicatorLayoutId}
                  className="absolute inset-0 rounded-md bg-white shadow-sm"
                  transition={motionTransitions.microInteraction}
                  aria-hidden="true"
                />
              ) : (
                <span className="absolute inset-0 rounded-md bg-white shadow-sm" aria-hidden="true" />
              ))}
            <span className="relative truncate">{option.label}</span>
          </MotionButton>
        )
      })}
    </div>
  )
}

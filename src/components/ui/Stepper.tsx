import { cn } from '@/lib/utils'

export interface StepperStep {
  id: string
  label: string
}

interface StepperProps {
  steps: StepperStep[]
  currentStepId: string
  completedStepIds?: string[]
  className?: string
}

export function Stepper({ steps, currentStepId, completedStepIds = [], className }: StepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId)
  const completedSet = new Set(completedStepIds)

  return (
    <nav aria-label="Progreso" className={cn('w-full px-2 sm:px-6', className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId
          const isCompleted = completedSet.has(step.id) || index < currentIndex
          const isUpcoming = !isCurrent && !isCompleted

          return (
            <li
              key={step.id}
              className={cn('flex min-w-0 items-center', index < steps.length - 1 ? 'flex-1' : 'shrink-0')}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex min-w-0 flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isCurrent && 'bg-brand-600 text-white',
                    isCompleted && 'bg-emerald-100 text-emerald-700',
                    isUpcoming && 'bg-surface-100 text-stone-400',
                  )}
                  aria-hidden="true"
                >
                  {isCompleted && !isCurrent ? '✓' : index + 1}
                </span>
                <span
                  className={cn(
                    'max-w-[4.5rem] truncate text-center text-[10px] font-medium sm:max-w-none sm:text-xs',
                    isCurrent && 'text-brand-700',
                    isCompleted && 'text-emerald-700',
                    isUpcoming && 'text-stone-400',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-1 mb-4 h-0.5 flex-1 rounded',
                    index < currentIndex || completedSet.has(steps[index + 1]?.id)
                      ? 'bg-emerald-200'
                      : 'bg-stone-200',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

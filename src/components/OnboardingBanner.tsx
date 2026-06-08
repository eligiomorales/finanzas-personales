import { useState } from 'react'
import { useMovements } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { useAuth } from '@/contexts/AuthContext'
import { useDataContext } from '@/contexts/DataContext'
import { hasDefaultDisplayName } from '@/lib/couple/person-labels'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Form'
import { ButtonLink, TextLink } from '@/components/ui/TextLink'

const DISMISSED_KEY = 'finanzas-onboarding-dismissed'

export function useOnboarding() {
  const movements = useMovements()
  const persons = useCouplePersons()
  const { configured } = useAuth()
  const { mode } = useDataContext()
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(DISMISSED_KEY) === 'true',
  )

  const movementCount = movements?.length ?? 0
  const needsNames =
    mode === 'remote' && configured
      ? hasDefaultDisplayName(persons.myName, persons.myRole)
      : hasDefaultDisplayName(persons.personAName, 'personA') ||
        hasDefaultDisplayName(persons.personBName, 'personB')
  const visible = !dismissed && (movementCount === 0 || needsNames)

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  return { visible, dismiss, movementCount, needsNames }
}

interface OnboardingBannerProps {
  movementCount: number
  needsNames: boolean
  onDismiss: () => void
}

export function OnboardingBanner({ movementCount, needsNames, onDismiss }: OnboardingBannerProps) {
  const steps = [
    {
      done: !needsNames,
      title: 'Configurá tu nombre',
      description: 'Definí cómo te mostramos en la app desde Ajustes (vinculado a tu cuenta).',
      action: needsNames ? { label: 'Ir a Ajustes', to: '/configuracion' } : undefined,
    },
    {
      done: movementCount > 0,
      title: 'Registrá o importá movimientos',
      description: 'Agregá un gasto manualmente o importá un resumen bancario.',
      action: movementCount === 0 ? { label: 'Nuevo movimiento', to: '/movimientos/nuevo' } : undefined,
    },
    {
      done: movementCount > 0,
      title: 'Revisá el balance del mes',
      description: 'En Inicio ves el resumen; en Balance el detalle entre personas.',
      action: movementCount > 0 ? { label: 'Ver balance', to: '/balance' } : undefined,
    },
  ]

  return (
    <Card className="border-brand-200/80 bg-gradient-to-br from-brand-50/80 to-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-brand-900">Primeros pasos</h3>
          <p className="mt-1 text-sm text-brand-800/80">
            Seguí esta guía para empezar a usar la app con tu pareja.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-brand-700"
          onClick={onDismiss}
          aria-label="Ocultar guía de primeros pasos"
        >
          ✕
        </Button>
      </div>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-brand-700 ring-1 ring-brand-200'
              }`}
              aria-hidden="true"
            >
              {step.done ? '✓' : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-800">{step.title}</p>
              <p className="text-xs text-stone-600">{step.description}</p>
              {step.action && !step.done && (
                <TextLink to={step.action.to} className="mt-1 inline-block text-xs">
                  {step.action.label} →
                </TextLink>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        {movementCount === 0 && (
          <ButtonLink to="/importar" variant="secondary" size="sm">
            Importar resumen
          </ButtonLink>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
          Entendido, ocultar
        </Button>
      </div>
    </Card>
  )
}

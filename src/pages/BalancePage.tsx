import { useState, useMemo } from 'react'
import { useMovementsInRange, useMovementsQuery, useSettings, useDataMutations } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { calculateCoupleBalanceForScope } from '@/lib/balance'
import { displayLabelForRole, formLabelWithName } from '@/lib/couple/person-labels'
import { formatInViewCurrency, getCurrencyConfig, SUPPORTED_CURRENCIES } from '@/lib/currency'
import { currentMonthRange, todayISO } from '@/lib/utils'
import type { CurrencyCode } from '@/types'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Dialog } from '@/components/ui/Dialog'
import { BalanceScopeSelector, type BalanceScope } from '@/components/BalanceScopeSelector'
import type { PeriodRange } from '@/components/PeriodFilter'
import { SkeletonCard } from '@/components/skeletons/SkeletonCard'
import {
  Button,
  Input,
  Select,
  Label,
  FormGroup,
  FieldHint,
  describedBy,
} from '@/components/ui/Form'

export function BalancePage() {
  const settings = useSettings()
  const persons = useCouplePersons()
  const { createSettlement } = useDataMutations()
  const currencyConfig = useMemo(() => getCurrencyConfig(settings), [settings])
  const [scope, setScope] = useState<BalanceScope>('current_month')
  const [customPeriod, setCustomPeriod] = useState<PeriodRange>(() => currentMonthRange())
  const [showSettlement, setShowSettlement] = useState(false)
  const [settlementAmount, setSettlementAmount] = useState(0)
  const [settlementCurrency, setSettlementCurrency] = useState<CurrencyCode>('ARS')
  const [settlementPaidBy, setSettlementPaidBy] = useState<'personA' | 'personB'>(
    () => persons.myRole ?? 'personA',
  )
  const [settlementDate, setSettlementDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)

  const periodRange = useMemo((): PeriodRange | undefined => {
    if (scope === 'all') return undefined
    if (scope === 'current_month') return currentMonthRange()
    return customPeriod
  }, [scope, customPeriod])

  const { movements: periodMovements, isLoading: periodLoading } = useMovementsInRange(periodRange)
  const { movements: allMovements, isLoading: allLoading } = useMovementsQuery({ enabled: scope === 'all' })

  const balanceMovements = scope === 'all' ? allMovements : periodMovements
  const isLoading = scope === 'all' ? allLoading : periodLoading

  const balance = useMemo(
    () =>
      calculateCoupleBalanceForScope(
        balanceMovements,
        currencyConfig,
        scope === 'all' ? 'all' : 'period',
      ),
    [balanceMovements, scope, currencyConfig],
  )

  const personAName = persons.personAName
  const personBName = persons.personBName
  const myRole = persons.myRole ?? 'personA'
  const viewerOwes = balance.owedBy !== 'balanced' && balance.owedBy === myRole

  const settlementSummary = (() => {
    const from = formLabelWithName(settlementPaidBy, persons)
    const toRole = settlementPaidBy === 'personA' ? 'personB' : 'personA'
    const to = displayLabelForRole(toRole, persons)
    return `${from} compensa a ${to}`
  })()

  function openSettlementForm() {
    if (balance.owedBy === 'balanced') return
    setSettlementAmount(Math.round(balance.owedAmount * 100) / 100)
    setSettlementCurrency(currencyConfig.displayCurrency)
    setSettlementPaidBy(balance.owedBy)
    setShowSettlement(true)
  }

  async function handleSettlement(e: React.FormEvent) {
    e.preventDefault()
    if (settlementAmount <= 0) return
    setSaving(true)
    try {
      const fromName = displayLabelForRole(settlementPaidBy, persons)
      const toRole = settlementPaidBy === 'personA' ? 'personB' : 'personA'
      const toName = displayLabelForRole(toRole, persons)
      await createSettlement(
        settlementAmount,
        settlementPaidBy,
        `Liquidación: ${fromName} paga a ${toName}`,
        settlementDate,
        settlementCurrency,
      )
      setShowSettlement(false)
    } finally {
      setSaving(false)
    }
  }

  const calculationHelp =
    scope === 'all'
      ? [
          'Incluye todos los gastos compartidos y liquidaciones registrados, sin filtro de fecha.',
          'Las liquidaciones reducen la deuda pendiente acumulada.',
        ]
      : [
          'Incluye gastos compartidos y liquidaciones del período seleccionado.',
          'Pagó y debía asumir reflejan solo gastos compartidos; las liquidaciones ajustan la deuda del período.',
          'Para ver la deuda acumulada sin filtro de fecha, usá el alcance Histórico.',
        ]

  return (
    <div className="space-y-6">
      <PageHeader title="Balance" />

      <BalanceScopeSelector
        scope={scope}
        onScopeChange={setScope}
        customPeriod={customPeriod}
        onCustomPeriodChange={setCustomPeriod}
      />

      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : (
        <>
          {balance.owedBy !== 'balanced' && (
            <Card
              className={
                viewerOwes ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
              }
            >
              <p
                className={`text-center text-lg font-semibold ${
                  viewerOwes ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {displayLabelForRole(balance.owedBy, persons, { preferYo: true })} debe{' '}
                {formatInViewCurrency(balance.owedAmount, currencyConfig)} a{' '}
                {displayLabelForRole(
                  balance.owedBy === 'personA' ? 'personB' : 'personA',
                  persons,
                  { preferYo: true },
                )}
              </p>
              <div className="mt-3 flex justify-center">
                <Button onClick={openSettlementForm}>Registrar liquidación</Button>
              </div>
            </Card>
          )}

          {balance.owedBy === 'balanced' && (
            <Card className="border-emerald-200 bg-emerald-50">
              <p className="text-center font-semibold text-emerald-700">Están saldados</p>
            </Card>
          )}

          <Card>
            <h3 className="mb-4 font-semibold">Detalle por persona</h3>
            <div className="space-y-3">
              {(['personA', 'personB'] as const).map((role) => {
                const data = role === 'personA' ? balance.personA : balance.personB
                const diff = data.difference
                return (
                  <div key={role} className="rounded-lg bg-surface-50 p-3">
                    <p className="mb-2 font-medium text-stone-800">
                      {displayLabelForRole(role, persons, { preferYo: true })}
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="shrink-0 text-stone-500">Pagó</span>
                        <span className="truncate text-right font-semibold tabular-nums">
                          {formatInViewCurrency(data.paid, currencyConfig)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="shrink-0 text-stone-500">Debía asumir</span>
                        <span className="truncate text-right font-semibold tabular-nums">
                          {formatInViewCurrency(data.assumed, currencyConfig)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 border-t border-stone-200 pt-1">
                        <span className="shrink-0 text-stone-500">Diferencia</span>
                        <span
                          className={`truncate text-right font-semibold tabular-nums ${
                            diff > 0
                              ? 'text-emerald-700'
                              : diff < 0
                                ? 'text-red-700'
                                : 'text-stone-600'
                          }`}
                        >
                          {diff >= 0 ? '+' : ''}
                          {formatInViewCurrency(diff, currencyConfig)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      <Card className="!p-0 overflow-hidden">
        <details className="group">
          <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-stone-700 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              ¿Cómo se calcula?
              <span
                className="text-sm font-normal text-stone-500 transition-transform group-open:rotate-180"
                aria-hidden="true"
              >
                ▼
              </span>
            </span>
          </summary>
          <ul className="space-y-1 border-t border-stone-100 px-4 py-3 text-sm text-stone-600">
            {calculationHelp.map((line) => (
              <li key={line}>· {line}</li>
            ))}
            <li>
              · <strong>Pagó:</strong> suma de gastos compartidos que cada uno abonó directamente.
            </li>
            <li>
              · <strong>Debía asumir:</strong> parte que le correspondía según el reparto acordado en
              cada gasto.
            </li>
            <li>
              · <strong>Diferencia:</strong> pagó menos lo que debía asumir; la deuda neta sale de
              comparar ambas personas.
            </li>
            <li>
              · Las liquidaciones reducen la deuda del alcance seleccionado; en Histórico también
              ajustan pagó y diferencia.
            </li>
            <li>· Los montos en USD se convierten con la cotización global de Ajustes.</li>
          </ul>
        </details>
      </Card>

      <Dialog
        open={showSettlement}
        onClose={() => !saving && setShowSettlement(false)}
        title="Registrar liquidación"
        description={`Confirmá quién paga la compensación. ${settlementSummary}.`}
        closeOnBackdrop={!saving}
      >
        <form onSubmit={handleSettlement}>
          <FormGroup>
            <Label htmlFor="settlement-amount">Monto</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  id="settlement-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(parseFloat(e.target.value) || 0)}
                  aria-describedby={describedBy('settlement-amount-hint')}
                />
              </div>
              <Select
                id="settlement-currency"
                value={settlementCurrency}
                onChange={(e) => setSettlementCurrency(e.target.value as CurrencyCode)}
                aria-label="Moneda de la liquidación"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <FieldHint id="settlement-amount-hint">
              Monto que se registrará como liquidación entre {personAName} y {personBName}.
            </FieldHint>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="settlement-paid-by">Quién paga la compensación</Label>
            <Select
              id="settlement-paid-by"
              value={settlementPaidBy}
              onChange={(e) => setSettlementPaidBy(e.target.value as 'personA' | 'personB')}
            >
              <option value="personA">{formLabelWithName('personA', persons)}</option>
              <option value="personB">{formLabelWithName('personB', persons)}</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="settlement-date">Fecha</Label>
            <Input
              id="settlement-date"
              type="date"
              value={settlementDate}
              onChange={(e) => setSettlementDate(e.target.value)}
            />
          </FormGroup>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Guardando...' : 'Confirmar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setShowSettlement(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

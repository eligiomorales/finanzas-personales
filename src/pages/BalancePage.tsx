import { useState, useMemo } from 'react'
import { useMovements, useSettings, useDataMutations } from '@/hooks/useData'
import { useCouplePersons } from '@/hooks/useCouplePersons'
import { calculateCoupleBalance } from '@/lib/balance'
import {
  displayLabelForRole,
  formLabelForRole,
  formLabelWithName,
} from '@/lib/couple/person-labels'
import { formatInViewCurrency, getCurrencyConfig, SUPPORTED_CURRENCIES } from '@/lib/currency'
import { currentMonthRange, filterMovements, todayISO } from '@/lib/utils'
import type { CurrencyCode, Movement } from '@/types'
import { StatCard, Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import {
  BalanceScopeSelector,
  balanceScopeDescription,
  type BalanceScope,
} from '@/components/BalanceScopeSelector'
import type { PeriodRange } from '@/components/PeriodFilter'
import {
  Button,
  Input,
  Select,
  Label,
  FormGroup,
  FieldHint,
  describedBy,
} from '@/components/ui/Form'

function movementsForScope(
  movements: Movement[] | undefined,
  scope: BalanceScope,
  customPeriod: PeriodRange,
) {
  const all = movements ?? []
  if (scope === 'all') return all
  if (scope === 'current_month') {
    const { from, to } = currentMonthRange()
    return filterMovements(all, { dateFrom: from, dateTo: to })
  }
  return filterMovements(all, { dateFrom: customPeriod.from, dateTo: customPeriod.to })
}

export function BalancePage() {
  const movements = useMovements()
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

  const scopedMovements = useMemo(
    () => movementsForScope(movements, scope, customPeriod),
    [movements, scope, customPeriod],
  )

  const balance = useMemo(
    () => calculateCoupleBalance(scopedMovements, currencyConfig),
    [scopedMovements, currencyConfig],
  )

  const personAName = persons.personAName
  const personBName = persons.personBName

  const settlementSummary = (() => {
    const from = formLabelWithName(settlementPaidBy, persons)
    const toRole = settlementPaidBy === 'personA' ? 'personB' : 'personA'
    const to = displayLabelForRole(toRole, persons)
    return `${from} compensa a ${to}`
  })()

  const scopeLabel = balanceScopeDescription(scope, customPeriod, currencyConfig.displayCurrency)

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
          'Incluye solo gastos compartidos y liquidaciones del período seleccionado.',
          'Para ver la deuda total sin filtro de fecha, usá el alcance Histórico.',
        ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Balance entre personas</h2>
        <p className="mt-1 text-sm text-slate-500">{scopeLabel}</p>
      </div>

      <BalanceScopeSelector
        scope={scope}
        onScopeChange={setScope}
        customPeriod={customPeriod}
        onCustomPeriodChange={setCustomPeriod}
      />

      {scope !== 'all' && (
        <p className="text-xs text-slate-500">
          Este balance puede diferir del histórico si hay movimientos en otros meses.
        </p>
      )}

      {balance.owedBy !== 'balanced' && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-center text-lg font-semibold text-amber-900">
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

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={`Pagó ${formLabelForRole('personA', persons).toLowerCase()}`}
          value={formatInViewCurrency(balance.personA.paid, currencyConfig)}
        />
        <StatCard
          label={`Pagó ${formLabelForRole('personB', persons).toLowerCase()}`}
          value={formatInViewCurrency(balance.personB.paid, currencyConfig)}
        />
        <StatCard
          label={`Asumió ${formLabelForRole('personA', persons).toLowerCase()}`}
          value={formatInViewCurrency(balance.personA.assumed, currencyConfig)}
        />
        <StatCard
          label={`Asumió ${formLabelForRole('personB', persons).toLowerCase()}`}
          value={formatInViewCurrency(balance.personB.assumed, currencyConfig)}
        />
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">Detalle por persona</h3>
        <div className="space-y-4">
          {(['personA', 'personB'] as const).map((role) => {
            const data = role === 'personA' ? balance.personA : balance.personB
            const diff = data.difference
            return (
              <div key={role} className="rounded-lg bg-slate-50 p-3">
                <p className="font-medium text-slate-800">
                  {displayLabelForRole(role, persons, { preferYo: true })}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500">Pagó</p>
                    <p className="font-semibold tabular-nums">
                      {formatInViewCurrency(data.paid, currencyConfig)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Debía asumir</p>
                    <p className="font-semibold tabular-nums">
                      {formatInViewCurrency(data.assumed, currencyConfig)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Diferencia</p>
                    <p
                      className={`font-semibold tabular-nums ${
                        diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-700' : 'text-slate-600'
                      }`}
                    >
                      {diff >= 0 ? '+' : ''}
                      {formatInViewCurrency(diff, currencyConfig)}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {diff > 0
                    ? 'Pagó de más (le deben compensar)'
                    : diff < 0
                      ? 'Pagó de menos (debe compensar)'
                      : 'Cuadrado'}
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <details className="group">
          <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-slate-700 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              ¿Cómo se calcula?
              <span
                className="text-sm font-normal text-slate-500 transition-transform group-open:rotate-180"
                aria-hidden="true"
              >
                ▼
              </span>
            </span>
          </summary>
          <ul className="space-y-1 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            {calculationHelp.map((line) => (
              <li key={line}>· {line}</li>
            ))}
            <li>
              · <strong>Pagó:</strong> suma de gastos compartidos que cada uno abonó directamente.
            </li>
            <li>
              · <strong>Debía asumir:</strong> parte que le correspondía según el reparto acordado en cada gasto.
            </li>
            <li>
              · <strong>Diferencia:</strong> pagó menos lo que debía asumir; la deuda neta sale de comparar ambas personas.
            </li>
            <li>· Las liquidaciones registradas reducen la deuda pendiente en el período.</li>
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

import { describe, expect, it } from 'vitest'
import {
  buildCouplePersonsView,
  formLabelForRole,
  formLabelWithName,
  payerDisplayLabel,
  payerListLabel,
  buildDefaultImportShare,
} from '@/lib/couple/person-labels'

describe('buildCouplePersonsView', () => {
  it('resuelve nombres desde perfiles y roles', () => {
    const view = buildCouplePersonsView({
      members: [
        { role: 'personA', userId: 'u1', displayName: 'Ana', email: 'ana@test.com' },
        { role: 'personB', userId: 'u2', displayName: 'Juan', email: 'juan@test.com' },
      ],
      myUserId: 'u1',
    })

    expect(view.myRole).toBe('personA')
    expect(view.myName).toBe('Ana')
    expect(view.partnerName).toBe('Juan')
    expect(view.personAName).toBe('Ana')
    expect(view.personBName).toBe('Juan')
  })

  it('usa fallback de settings si falta display_name', () => {
    const view = buildCouplePersonsView({
      members: [{ role: 'personB', userId: 'u2', displayName: null, email: 'j@test.com' }],
      myUserId: 'u2',
      fallback: { personAName: 'Eligio', personBName: 'Persona B' },
    })

    expect(view.personBName).toBe('j')
    expect(view.partnerName).toBe('Eligio')
  })
})

describe('form labels', () => {
  const view = buildCouplePersonsView({
    members: [
      { role: 'personA', userId: 'u1', displayName: 'Ana', email: 'a@t.com' },
      { role: 'personB', userId: 'u2', displayName: 'Juan', email: 'j@t.com' },
    ],
    myUserId: 'u2',
  })

  it('muestra Yo / Mi pareja en formularios', () => {
    expect(formLabelForRole('personB', view)).toBe('Yo')
    expect(formLabelForRole('personA', view)).toBe('Mi pareja')
    expect(formLabelWithName('personB', view)).toBe('Yo (Juan)')
  })

  it('muestra Yo en listas cuando corresponde', () => {
    expect(payerDisplayLabel('personB', view)).toBe('Yo')
    expect(payerDisplayLabel('personA', view)).toBe('Mi pareja')
  })

  it('payerListLabel usa nombres reales en la lista de movimientos', () => {
    expect(payerListLabel('personB', view)).toBe('Juan')
    expect(payerListLabel('personA', view)).toBe('Ana')
    expect(payerListLabel('both', view)).toBe('Ambos')
  })
})

describe('buildDefaultImportShare', () => {
  it('usa el rol del usuario logueado', () => {
    expect(buildDefaultImportShare('personB').paidBy).toBe('personB')
    expect(buildDefaultImportShare(null).paidBy).toBe('personA')
  })
})

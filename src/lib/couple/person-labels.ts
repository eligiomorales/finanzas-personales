import type { Payer } from '@/types'

export type PersonRole = 'personA' | 'personB'

export interface CouplePersonsView {
  myRole: PersonRole | null
  myName: string
  partnerName: string
  personAName: string
  personBName: string
}

export function buildCouplePersonsView(params: {
  members: {
    role: PersonRole
    userId: string
    displayName: string | null
    email: string
  }[]
  myUserId: string | null
  fallback?: { personAName: string; personBName: string }
}): CouplePersonsView {
  const fallbackA = params.fallback?.personAName ?? 'Persona A'
  const fallbackB = params.fallback?.personBName ?? 'Persona B'

  function resolveName(
    role: PersonRole,
    member?: (typeof params.members)[number],
  ): string {
    const fallback = role === 'personA' ? fallbackA : fallbackB
    if (!member) return fallback
    const trimmed = member.displayName?.trim()
    if (trimmed) return trimmed
    const emailPrefix = member.email.split('@')[0]?.trim()
    if (emailPrefix) return emailPrefix
    return fallback
  }

  const memberA = params.members.find((m) => m.role === 'personA')
  const memberB = params.members.find((m) => m.role === 'personB')
  const personAName = resolveName('personA', memberA)
  const personBName = resolveName('personB', memberB)

  const myMember = params.myUserId
    ? params.members.find((m) => m.userId === params.myUserId)
    : undefined
  const myRole = myMember?.role ?? (params.myUserId ? null : 'personA')
  const partnerMember = myRole
    ? params.members.find((m) => m.role !== myRole)
    : undefined

  const myName = myRole === 'personA' ? personAName : myRole === 'personB' ? personBName : personAName
  const partnerName =
    myRole === 'personA' ? personBName : myRole === 'personB' ? personAName : personBName

  if (myRole && !partnerMember && params.members.length === 1) {
    return {
      myRole,
      myName,
      partnerName: myRole === 'personA' ? fallbackB : fallbackA,
      personAName,
      personBName,
    }
  }

  return { myRole, myName, partnerName, personAName, personBName }
}

/** Etiqueta corta para formularios: Yo / Mi pareja / nombre en modo local */
export function formLabelForRole(role: PersonRole, view: CouplePersonsView): string {
  if (view.myRole && role === view.myRole) return 'Yo'
  if (view.myRole && role !== view.myRole) return 'Mi pareja'
  return role === 'personA' ? view.personAName : view.personBName
}

/** Etiqueta para selects y botones con nombre entre paréntesis */
export function formLabelWithName(role: PersonRole, view: CouplePersonsView): string {
  const name = role === 'personA' ? view.personAName : view.personBName
  const short = formLabelForRole(role, view)
  if (short === 'Yo' || short === 'Mi pareja') return `${short} (${name})`
  return name
}

/** Etiqueta para listas, balance y dashboard (nombres reales; Yo si aplica) */
export function displayLabelForRole(
  role: PersonRole,
  view: CouplePersonsView,
  options?: { preferYo?: boolean },
): string {
  const name = role === 'personA' ? view.personAName : view.personBName
  if (options?.preferYo && view.myRole === role) return 'Yo'
  return name
}

export function payerDisplayLabel(paidBy: Payer, view: CouplePersonsView): string {
  switch (paidBy) {
    case 'personA':
      if (view.myRole === 'personA') return 'Yo'
      if (view.myRole === 'personB') return 'Mi pareja'
      return view.personAName
    case 'personB':
      if (view.myRole === 'personB') return 'Yo'
      if (view.myRole === 'personA') return 'Mi pareja'
      return view.personBName
    case 'both':
      return 'Ambos'
  }
}

export function payerFilterLabel(paidBy: Payer, view: CouplePersonsView): string {
  switch (paidBy) {
    case 'personA':
      return formLabelWithName('personA', view)
    case 'personB':
      return formLabelWithName('personB', view)
    case 'both':
      return 'Ambos'
  }
}

export function sharePercentLabel(role: PersonRole, view: CouplePersonsView): string {
  const name = role === 'personA' ? view.personAName : view.personBName
  return `${name} (%)`
}

export function hasDefaultDisplayName(name: string, role: PersonRole | null): boolean {
  const trimmed = name.trim()
  if (!trimmed) return true
  if (role === 'personA' && trimmed === 'Persona A') return true
  if (role === 'personB' && trimmed === 'Persona B') return true
  return false
}

export function buildDefaultImportShare(myRole: PersonRole | null): {
  paidBy: Payer
  isShared: boolean
  sharePersonA: number
  sharePersonB: number
  splitPreset: string
} {
  return {
    paidBy: myRole ?? 'personA',
    isShared: true,
    sharePersonA: 50,
    sharePersonB: 50,
    splitPreset: '50-50',
  }
}

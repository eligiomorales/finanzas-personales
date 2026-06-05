export const INVITE_CODE_VALIDITY_DAYS = 7

export const INVITE_CODE_VALIDITY_MS = INVITE_CODE_VALIDITY_DAYS * 24 * 60 * 60 * 1000

export type InviteCodeStatus = 'active' | 'expired' | 'complete' | 'no_expiry'

export function inviteCodeExpiresAtFromNow(now = new Date()): string {
  return new Date(now.getTime() + INVITE_CODE_VALIDITY_MS).toISOString()
}

export function getInviteCodeStatus(
  expiresAt: string | null | undefined,
  memberCount: number,
  now = new Date(),
): InviteCodeStatus {
  if (memberCount >= 2) return 'complete'
  if (!expiresAt) return 'no_expiry'
  if (new Date(expiresAt) <= now) return 'expired'
  return 'active'
}

export function getInviteCodeJoinError(
  expiresAt: string | null | undefined,
  memberCount: number,
  now = new Date(),
): string | null {
  const joinError = getInviteCodeStatus(expiresAt, memberCount, now)
  if (joinError === 'complete') return 'Esta pareja ya tiene dos miembros'
  if (joinError === 'expired') return 'El código de invitación expiró o fue revocado'
  return null
}

export function formatInviteCodeStatus(
  expiresAt: string | null | undefined,
  memberCount: number,
  now = new Date(),
): string {
  const status = getInviteCodeStatus(expiresAt, memberCount, now)
  switch (status) {
    case 'complete':
      return 'Pareja completa — el código ya no se puede usar'
    case 'expired':
      return 'Expirado o revocado — regenerá un código nuevo para invitar'
    case 'no_expiry':
      return 'Activo sin fecha de vencimiento'
    case 'active':
      return `Activo hasta ${new Date(expiresAt!).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`
  }
}

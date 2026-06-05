import { describe, expect, it } from 'vitest'
import {
  getInviteCodeJoinError,
  getInviteCodeStatus,
  inviteCodeExpiresAtFromNow,
  INVITE_CODE_VALIDITY_DAYS,
} from '@/lib/couple/invite-code'

const now = new Date('2025-06-01T12:00:00.000Z')

describe('invite-code', () => {
  it('generates expiration INVITE_CODE_VALIDITY_DAYS ahead', () => {
    const expiresAt = inviteCodeExpiresAtFromNow(now)
    const diffDays = (new Date(expiresAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    expect(diffDays).toBe(INVITE_CODE_VALIDITY_DAYS)
  })

  it('treats null expiration as no_expiry when one member', () => {
    expect(getInviteCodeStatus(null, 1, now)).toBe('no_expiry')
    expect(getInviteCodeJoinError(null, 1, now)).toBeNull()
  })

  it('rejects expired codes', () => {
    const expiredAt = '2025-05-01T00:00:00.000Z'
    expect(getInviteCodeStatus(expiredAt, 1, now)).toBe('expired')
    expect(getInviteCodeJoinError(expiredAt, 1, now)).toBe(
      'El código de invitación expiró o fue revocado',
    )
  })

  it('accepts future expiration', () => {
    const futureAt = '2025-07-01T00:00:00.000Z'
    expect(getInviteCodeStatus(futureAt, 1, now)).toBe('active')
    expect(getInviteCodeJoinError(futureAt, 1, now)).toBeNull()
  })

  it('marks complete couples regardless of expiration', () => {
    expect(getInviteCodeStatus(null, 2, now)).toBe('complete')
    expect(getInviteCodeJoinError(null, 2, now)).toBe('Esta pareja ya tiene dos miembros')
  })
})

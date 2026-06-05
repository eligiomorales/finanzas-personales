import { DEFAULT_CATEGORIES } from '@/lib/couple/defaults'
import {
  getInviteCodeJoinError,
  inviteCodeExpiresAtFromNow,
} from '@/lib/couple/invite-code'
import { getSupabaseClient } from '@/lib/supabase/client'
import { generateId, generateInviteCode } from '@/lib/utils'

export interface CoupleMembership {
  coupleId: string
  role: 'personA' | 'personB'
  inviteCode: string
  inviteCodeExpiresAt: string | null
  memberCount: number
}

function formatSupabaseError(error: { message: string; code?: string; details?: string }): string {
  if (error.code === '23503') {
    return 'Tu perfil no está listo todavía. Cerrá sesión, volvé a entrar e intentá de nuevo.'
  }
  if (error.code === '23505') {
    return 'Ya pertenecés a una pareja o el código ya fue usado.'
  }
  return error.message
}

async function ensureProfile(userId: string, email: string): Promise<void> {
  const supabase = getSupabaseClient()

  const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (existing) return

  const { error } = await supabase.from('profiles').insert({
    id: userId,
    email,
  })

  if (error && error.code !== '23505') {
    throw new Error(formatSupabaseError(error))
  }
}

async function fetchMemberCount(coupleId: string): Promise<number> {
  const supabase = getSupabaseClient()
  const { count, error } = await supabase
    .from('couple_members')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', coupleId)

  if (error) throw new Error(formatSupabaseError(error))
  return count ?? 0
}

export async function fetchCoupleMembership(userId: string): Promise<CoupleMembership | null> {
  const supabase = getSupabaseClient()

  const { data: member, error } = await supabase
    .from('couple_members')
    .select('couple_id, role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(formatSupabaseError(error))
  if (!member) return null

  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .select('invite_code, invite_code_expires_at')
    .eq('id', member.couple_id)
    .single()

  if (coupleError) throw new Error(formatSupabaseError(coupleError))

  const memberCount = await fetchMemberCount(member.couple_id)

  return {
    coupleId: member.couple_id,
    role: member.role,
    inviteCode: couple.invite_code,
    inviteCodeExpiresAt: couple.invite_code_expires_at,
    memberCount,
  }
}

export async function createCouple(userId: string, email: string, displayName?: string): Promise<CoupleMembership> {
  const supabase = getSupabaseClient()

  const existing = await fetchCoupleMembership(userId)
  if (existing) return existing

  await ensureProfile(userId, email)

  const inviteCode = generateInviteCode()
  const inviteCodeExpiresAt = inviteCodeExpiresAtFromNow()

  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .insert({
      invite_code: inviteCode,
      invite_code_expires_at: inviteCodeExpiresAt,
      created_by: userId,
    })
    .select('id, invite_code, invite_code_expires_at')
    .single()

  if (coupleError) throw new Error(formatSupabaseError(coupleError))

  const { error: memberError } = await supabase.from('couple_members').insert({
    couple_id: couple.id,
    user_id: userId,
    role: 'personA',
  })

  if (memberError) throw new Error(formatSupabaseError(memberError))

  const personAName = displayName?.trim() || 'Persona A'

  const { error: settingsError } = await supabase.from('couple_settings').insert({
    couple_id: couple.id,
    person_a_name: personAName,
    person_b_name: 'Persona B',
    display_currency: 'ARS',
    default_exchange_rate_usd: 1200,
  })

  if (settingsError) throw new Error(formatSupabaseError(settingsError))

  const categoryRows = DEFAULT_CATEGORIES.map((cat) => ({
    id: generateId(),
    couple_id: couple.id,
    name: cat.name,
    type: cat.type,
    color: cat.color ?? null,
  }))

  const { error: categoriesError } = await supabase.from('categories').insert(categoryRows)
  if (categoriesError) throw new Error(formatSupabaseError(categoriesError))

  return {
    coupleId: couple.id,
    role: 'personA',
    inviteCode: couple.invite_code,
    inviteCodeExpiresAt: couple.invite_code_expires_at,
    memberCount: 1,
  }
}

export async function joinCouple(userId: string, email: string, inviteCode: string): Promise<CoupleMembership> {
  const supabase = getSupabaseClient()
  const normalizedCode = inviteCode.trim().toUpperCase()

  const existing = await fetchCoupleMembership(userId)
  if (existing) return existing

  await ensureProfile(userId, email)

  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .select('id, invite_code, invite_code_expires_at')
    .eq('invite_code', normalizedCode)
    .maybeSingle()

  if (coupleError) throw new Error(formatSupabaseError(coupleError))
  if (!couple) throw new Error('Código de invitación inválido')

  const { data: existingMembers, error: membersError } = await supabase
    .from('couple_members')
    .select('role')
    .eq('couple_id', couple.id)

  if (membersError) throw new Error(formatSupabaseError(membersError))

  const memberCount = existingMembers?.length ?? 0
  const joinError = getInviteCodeJoinError(couple.invite_code_expires_at, memberCount)
  if (joinError) throw new Error(joinError)

  const { error: joinErrorInsert } = await supabase.from('couple_members').insert({
    couple_id: couple.id,
    user_id: userId,
    role: 'personB',
  })

  if (joinErrorInsert) {
    if (joinErrorInsert.code === '23505') {
      throw new Error('Ya pertenecés a una pareja')
    }
    throw new Error(formatSupabaseError(joinErrorInsert))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', userId)
    .maybeSingle()

  const personBName =
    profile?.display_name?.trim() ||
    email.split('@')[0]?.trim() ||
    'Persona B'

  const { error: settingsSyncError } = await supabase
    .from('couple_settings')
    .update({ person_b_name: personBName })
    .eq('couple_id', couple.id)

  if (settingsSyncError) throw new Error(formatSupabaseError(settingsSyncError))

  const { error: expireError } = await supabase
    .from('couples')
    .update({ invite_code_expires_at: new Date().toISOString() })
    .eq('id', couple.id)

  if (expireError) throw new Error(formatSupabaseError(expireError))

  return {
    coupleId: couple.id,
    role: 'personB',
    inviteCode: couple.invite_code,
    inviteCodeExpiresAt: new Date().toISOString(),
    memberCount: 2,
  }
}

export async function regenerateInviteCode(userId: string): Promise<CoupleMembership> {
  const membership = await fetchCoupleMembership(userId)
  if (!membership) throw new Error('No pertenecés a una pareja')

  if (membership.memberCount >= 2) {
    throw new Error('La pareja ya está completa; no hace falta un código de invitación')
  }

  const supabase = getSupabaseClient()
  const newCode = generateInviteCode()
  const inviteCodeExpiresAt = inviteCodeExpiresAtFromNow()

  const { error } = await supabase
    .from('couples')
    .update({
      invite_code: newCode,
      invite_code_expires_at: inviteCodeExpiresAt,
    })
    .eq('id', membership.coupleId)

  if (error) throw new Error(formatSupabaseError(error))

  const updated = await fetchCoupleMembership(userId)
  if (!updated) throw new Error('No se pudo actualizar el código de invitación')
  return updated
}

export async function revokeInviteCode(userId: string): Promise<CoupleMembership> {
  const membership = await fetchCoupleMembership(userId)
  if (!membership) throw new Error('No pertenecés a una pareja')

  if (membership.memberCount >= 2) {
    throw new Error('La pareja ya está completa; el código ya no se puede usar')
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('couples')
    .update({ invite_code_expires_at: new Date().toISOString() })
    .eq('id', membership.coupleId)

  if (error) throw new Error(formatSupabaseError(error))

  const updated = await fetchCoupleMembership(userId)
  if (!updated) throw new Error('No se pudo revocar el código de invitación')
  return updated
}

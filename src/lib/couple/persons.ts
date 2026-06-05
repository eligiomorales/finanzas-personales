import {
  buildCouplePersonsView,
  type CouplePersonsView,
  type PersonRole,
} from '@/lib/couple/person-labels'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ProfileRow {
  display_name: string | null
  email: string
}

interface MemberRow {
  role: PersonRole
  user_id: string
  profiles: ProfileRow | ProfileRow[] | null
}

function profileFromJoin(profiles: MemberRow['profiles']): ProfileRow | null {
  if (!profiles) return null
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles
}

export async function fetchCouplePersons(
  coupleId: string,
  myUserId: string | null,
  settingsFallback?: { personAName: string; personBName: string },
): Promise<CouplePersonsView> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('couple_members')
    .select('role, user_id, profiles:user_id ( display_name, email )')
    .eq('couple_id', coupleId)

  if (error) throw new Error(error.message)

  const members = ((data ?? []) as MemberRow[]).map((row) => {
    const profile = profileFromJoin(row.profiles)
    return {
      role: row.role,
      userId: row.user_id,
      displayName: profile?.display_name ?? null,
      email: profile?.email ?? '',
    }
  })

  return buildCouplePersonsView({ members, myUserId, fallback: settingsFallback })
}

export async function updateMyDisplayName(
  userId: string,
  coupleId: string,
  role: PersonRole,
  displayName: string,
): Promise<void> {
  const supabase = getSupabaseClient()
  const trimmed = displayName.trim()
  if (!trimmed) throw new Error('El nombre no puede estar vacío')

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ display_name: trimmed })
    .eq('id', userId)

  if (profileError) throw new Error(profileError.message)

  const settingsUpdate =
    role === 'personA'
      ? { person_a_name: trimmed }
      : { person_b_name: trimmed }

  const { error: settingsError } = await supabase
    .from('couple_settings')
    .update(settingsUpdate)
    .eq('couple_id', coupleId)

  if (settingsError) throw new Error(settingsError.message)
}

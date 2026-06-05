import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  createCouple,
  fetchCoupleMembership,
  joinCouple,
  regenerateInviteCode,
  revokeInviteCode,
  type CoupleMembership,
} from '@/lib/couple/service'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  membership: CoupleMembership | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshMembership: () => Promise<void>
  setupCouple: (mode: 'create' | 'join', inviteCode?: string) => Promise<void>
  regenerateInviteCode: () => Promise<void>
  revokeInviteCode: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const [loading, setLoading] = useState(configured)
  const [session, setSession] = useState<Session | null>(null)
  const [membership, setMembership] = useState<CoupleMembership | null>(null)
  const membershipFetchGen = useRef(0)

  const refreshMembership = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) {
      setMembership(null)
      return
    }

    const gen = ++membershipFetchGen.current

    try {
      const result = await fetchCoupleMembership(userId)
      if (gen === membershipFetchGen.current) {
        setMembership(result)
      }
    } catch (error) {
      console.error('No se pudo cargar la pareja:', error)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    const supabase = getSupabaseClient()
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [configured])

  useEffect(() => {
    if (!configured) return

    if (!session?.user?.id) {
      membershipFetchGen.current += 1
      setMembership(null)
      return
    }

    void refreshMembership()
  }, [configured, session?.user?.id, refreshMembership])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabaseClient().auth.signUp({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    membershipFetchGen.current += 1
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) throw error
    setMembership(null)
  }, [])

  const setupCouple = useCallback(
    async (mode: 'create' | 'join', inviteCode?: string) => {
      const user = session?.user
      if (!user) throw new Error('No autenticado')

      membershipFetchGen.current += 1
      const gen = ++membershipFetchGen.current
      const displayName = user.user_metadata?.display_name as string | undefined
      const email = user.email ?? ''

      const result =
        mode === 'create'
          ? await createCouple(user.id, email, displayName)
          : await joinCouple(user.id, email, inviteCode ?? '')

      if (gen === membershipFetchGen.current) {
        setMembership(result)
      }
    },
    [session?.user],
  )

  const handleRegenerateInviteCode = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) throw new Error('No autenticado')

    membershipFetchGen.current += 1
    const gen = ++membershipFetchGen.current
    const result = await regenerateInviteCode(userId)

    if (gen === membershipFetchGen.current) {
      setMembership(result)
    }
  }, [session?.user?.id])

  const handleRevokeInviteCode = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) throw new Error('No autenticado')

    membershipFetchGen.current += 1
    const gen = ++membershipFetchGen.current
    const result = await revokeInviteCode(userId)

    if (gen === membershipFetchGen.current) {
      setMembership(result)
    }
  }, [session?.user?.id])

  const value = useMemo(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      membership,
      signIn,
      signUp,
      signOut,
      refreshMembership,
      setupCouple,
      regenerateInviteCode: handleRegenerateInviteCode,
      revokeInviteCode: handleRevokeInviteCode,
    }),
    [
      configured,
      loading,
      session,
      membership,
      signIn,
      signUp,
      signOut,
      refreshMembership,
      setupCouple,
      handleRegenerateInviteCode,
      handleRevokeInviteCode,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

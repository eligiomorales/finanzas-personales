import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDataContext } from '@/contexts/DataContext'
import {
  buildCouplePersonsView,
  type CouplePersonsView,
} from '@/lib/couple/person-labels'
import { fetchCouplePersons } from '@/lib/couple/persons'
import { useSettings } from '@/hooks/useData'

const EMPTY_VIEW: CouplePersonsView = {
  myRole: null,
  myName: 'Persona A',
  partnerName: 'Persona B',
  personAName: 'Persona A',
  personBName: 'Persona B',
}

export function useCouplePersons(): CouplePersonsView & {
  loading: boolean
  refresh: () => Promise<void>
} {
  const { user, membership } = useAuth()
  const { mode, coupleId } = useDataContext()
  const settings = useSettings()
  const [remoteView, setRemoteView] = useState<CouplePersonsView | null>(null)
  const [loading, setLoading] = useState(mode === 'remote')

  const settingsFallback = useMemo(
    () =>
      settings
        ? { personAName: settings.personAName, personBName: settings.personBName }
        : undefined,
    [settings],
  )

  const localView = useMemo(
    () =>
      buildCouplePersonsView({
        members: [],
        myUserId: null,
        fallback: settingsFallback ?? {
          personAName: 'Persona A',
          personBName: 'Persona B',
        },
      }),
    [settingsFallback],
  )

  const refresh = useCallback(async () => {
    if (mode !== 'remote' || !coupleId) {
      setRemoteView(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const view = await fetchCouplePersons(coupleId, user?.id ?? null, settingsFallback)
      setRemoteView(view)
    } catch (error) {
      console.error('No se pudieron cargar los datos de la pareja:', error)
      if (settingsFallback) {
        setRemoteView(
          buildCouplePersonsView({
            members: membership
              ? [{ role: membership.role, userId: user?.id ?? '', displayName: null, email: user?.email ?? '' }]
              : [],
            myUserId: user?.id ?? null,
            fallback: settingsFallback,
          }),
        )
      }
    } finally {
      setLoading(false)
    }
  }, [mode, coupleId, user?.id, user?.email, membership, settingsFallback])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const view = mode === 'remote' && remoteView ? remoteView : localView

  return { ...view, loading, refresh }
}

export { EMPTY_VIEW as emptyCouplePersonsView }

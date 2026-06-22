import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useDataContext } from '@/contexts/DataContext'
import {
  buildCouplePersonsView,
  type CouplePersonsView,
} from '@/lib/couple/person-labels'
import { fetchCouplePersons } from '@/lib/couple/persons'
import { useSettings } from '@/hooks/useData'
import { queryKeys } from '@/lib/query/keys'
import { isInitialRemoteLoad, useRemoteQuery } from '@/hooks/useRemoteQuery'

const EMPTY_VIEW: CouplePersonsView = {
  myRole: null,
  myName: 'Persona A',
  partnerName: 'Persona B',
  personAName: 'Persona A',
  personBName: 'Persona B',
  hasConfiguredNames: false,
}

export function useCouplePersons(): CouplePersonsView & {
  loading: boolean
  refresh: () => Promise<void>
} {
  const { user, membership } = useAuth()
  const { mode, coupleId } = useDataContext()
  const settings = useSettings()
  const queryClient = useQueryClient()

  const settingsFallback = useMemo(
    () =>
      settings
        ? { personAName: settings.personAName, personBName: settings.personBName }
        : undefined,
    [settings?.personAName, settings?.personBName],
  )

  const fallbackKey = settingsFallback
    ? `${settingsFallback.personAName}|${settingsFallback.personBName}`
    : 'pending'

  const remoteQuery = useRemoteQuery(
    queryKeys.couplePersons(coupleId ?? 'local', user?.id ?? '', fallbackKey),
    () => fetchCouplePersons(coupleId!, user?.id ?? null, settingsFallback),
    { enabled: !!coupleId && !!settingsFallback },
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
    if (mode !== 'remote' || !coupleId) return
    await queryClient.invalidateQueries({
      queryKey: queryKeys.couplePersons(coupleId, user?.id ?? '', fallbackKey),
    })
  }, [mode, coupleId, user?.id, fallbackKey, queryClient])

  const remoteView = remoteQuery.isError
    ? buildCouplePersonsView({
        members: membership
          ? [
              {
                role: membership.role,
                userId: user?.id ?? '',
                displayName: null,
                email: user?.email ?? '',
              },
            ]
          : [],
        myUserId: user?.id ?? null,
        fallback: settingsFallback ?? EMPTY_VIEW,
      })
    : remoteQuery.data

  const loading = mode === 'remote' && isInitialRemoteLoad(remoteQuery)
  const view = mode === 'remote' && remoteView ? remoteView : localView

  return useMemo(
    () => ({
      myRole: view.myRole,
      myName: view.myName,
      partnerName: view.partnerName,
      personAName: view.personAName,
      personBName: view.personBName,
      hasConfiguredNames: view.hasConfiguredNames,
      loading,
      refresh,
    }),
    [
      view.myRole,
      view.myName,
      view.partnerName,
      view.personAName,
      view.personBName,
      view.hasConfiguredNames,
      loading,
      refresh,
    ],
  )
}

export { EMPTY_VIEW as emptyCouplePersonsView }

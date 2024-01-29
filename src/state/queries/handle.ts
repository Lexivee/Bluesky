import React from 'react'
import {useQueryClient, useMutation} from '@tanstack/react-query'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'

const fetchHandleQueryKey = (handleOrDid: string) =>
  ['handle', handleOrDid] as const
const fetchDidQueryKey = (handleOrDid: string) => ['did', handleOrDid] as const

export function useFetchHandle() {
  const queryClient = useQueryClient()

  return React.useCallback(
    async (handleOrDid: string) => {
      if (handleOrDid.startsWith('did:')) {
        const res = await queryClient.fetchQuery({
          staleTime: STALE.MINUTES.FIVE,
          queryKey: fetchHandleQueryKey(handleOrDid),
          queryFn: () => getAgent().getProfile({actor: handleOrDid}),
        })
        return res.data.handle
      }
      return handleOrDid
    },
    [queryClient],
  )
}

export function useUpdateHandleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({handle}: {handle: string}) => {
      await getAgent().updateHandle({handle})
    },
    onSuccess(_data, variables) {
      queryClient.invalidateQueries({
        queryKey: fetchHandleQueryKey(variables.handle),
      })
    },
  })
}

export function useFetchDid() {
  const queryClient = useQueryClient()

  return React.useCallback(
    async (handleOrDid: string) => {
      return queryClient.fetchQuery({
        staleTime: STALE.INFINITY,
        queryKey: fetchDidQueryKey(handleOrDid),
        queryFn: async () => {
          let identifier = handleOrDid
          if (!identifier.startsWith('did:')) {
            const res = await getAgent().resolveHandle({handle: identifier})
            identifier = res.data.did
          }
          return identifier
        },
      })
    },
    [queryClient],
  )
}

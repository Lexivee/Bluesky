import {createContext, useContext, useMemo} from 'react'
import {
  AppBskyActorDefs,
  BSKY_LABELER_DID,
  BskyFeedViewPreference,
  LabelPreference,
  ModerationOpts,
} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {track} from '#/lib/analytics/analytics'
import {getAge} from '#/lib/strings/time'
import {useHiddenPosts, useLabelDefinitions} from '#/state/preferences'
import {STALE} from '#/state/queries'
import {
  DEFAULT_HOME_FEED_PREFS,
  DEFAULT_LOGGED_OUT_PREFERENCES,
  DEFAULT_THREAD_VIEW_PREFS,
} from '#/state/queries/preferences/const'
import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'
import {
  ThreadViewPreferences,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences/types'
import {getAgent, useSession} from '#/state/session'
import {saveLabelers} from '#/state/session/agent-config'

export * from '#/state/queries/preferences/const'
export * from '#/state/queries/preferences/moderation'
export * from '#/state/queries/preferences/types'

const preferencesQueryKeyRoot = 'getPreferences'
export const preferencesQueryKey = [preferencesQueryKeyRoot]

export function usePreferencesQuery() {
  return useQuery({
    staleTime: STALE.SECONDS.FIFTEEN,
    structuralSharing: true,
    refetchOnWindowFocus: true,
    queryKey: preferencesQueryKey,
    queryFn: async () => {
      const agent = getAgent()

      if (agent.session?.did === undefined) {
        return DEFAULT_LOGGED_OUT_PREFERENCES
      } else {
        const res = await agent.getPreferences()

        // save to local storage to ensure there are labels on initial requests
        saveLabelers(
          agent.session.did,
          res.moderationPrefs.labelers.map(l => l.did),
        )

        const preferences: UsePreferencesQueryResponse = {
          ...res,
          savedFeeds: res.savedFeeds.filter(f => f.type !== 'unknown'),
          /**
           * Special preference, only used for following feed, previously
           * called `home`
           */
          feedViewPrefs: {
            ...DEFAULT_HOME_FEED_PREFS,
            ...(res.feedViewPrefs.home || {}),
          },
          threadViewPrefs: {
            ...DEFAULT_THREAD_VIEW_PREFS,
            ...(res.threadViewPrefs ?? {}),
          },
          userAge: res.birthDate ? getAge(res.birthDate) : undefined,
        }
        return preferences
      }
    },
  })
}

// used in the moderation state devtool
export const moderationOptsOverrideContext = createContext<
  ModerationOpts | undefined
>(undefined)

export function useModerationOpts() {
  const override = useContext(moderationOptsOverrideContext)
  const {currentAccount} = useSession()
  const prefs = usePreferencesQuery()
  const {labelDefs} = useLabelDefinitions()
  const hiddenPosts = useHiddenPosts() // TODO move this into pds-stored prefs
  const opts = useMemo<ModerationOpts | undefined>(() => {
    if (override) {
      return override
    }
    if (!prefs.data) {
      return
    }
    return {
      userDid: currentAccount?.did,
      prefs: {
        ...prefs.data.moderationPrefs,
        labelers: prefs.data.moderationPrefs.labelers.length
          ? prefs.data.moderationPrefs.labelers
          : [
              {
                did: BSKY_LABELER_DID,
                labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
              },
            ],
        hiddenPosts: hiddenPosts || [],
      },
      labelDefs,
    }
  }, [override, currentAccount, labelDefs, prefs.data, hiddenPosts])
  return opts
}

export function useClearPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await getAgent().app.bsky.actor.putPreferences({preferences: []})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetContentLabelMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    unknown,
    {label: string; visibility: LabelPreference; labelerDid: string | undefined}
  >({
    mutationFn: async ({label, visibility, labelerDid}) => {
      await getAgent().setContentLabelPref(label, visibility, labelerDid)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetContentLabelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      label,
      visibility,
      labelerDid,
    }: {
      label: string
      visibility: LabelPreference
      labelerDid?: string
    }) => {
      await getAgent().setContentLabelPref(label, visibility, labelerDid)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetAdultContentMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {enabled: boolean}>({
    mutationFn: async ({enabled}) => {
      await getAgent().setAdultContentEnabled(enabled)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function usePreferencesSetBirthDateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, {birthDate: Date}>({
    mutationFn: async ({birthDate}: {birthDate: Date}) => {
      await getAgent().setPersonalDetails({birthDate: birthDate.toISOString()})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetFeedViewPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, Partial<BskyFeedViewPreference>>({
    mutationFn: async prefs => {
      /*
       * special handling here, merged into `feedViewPrefs` above, since
       * following was previously called `home`
       */
      await getAgent().setFeedViewPrefs('home', prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useSetThreadViewPreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, Partial<ThreadViewPreferences>>({
    mutationFn: async prefs => {
      await getAgent().setThreadViewPrefs(prefs)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useOverwriteSavedFeedsMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, AppBskyActorDefs.SavedFeed[]>({
    mutationFn: async savedFeeds => {
      await getAgent().overwriteSavedFeeds(savedFeeds)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useAddSavedFeedsMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    unknown,
    Pick<AppBskyActorDefs.SavedFeed, 'type' | 'value' | 'pinned'>[]
  >({
    mutationFn: async savedFeeds => {
      await getAgent().addSavedFeeds(savedFeeds)
      track('CustomFeed:Save')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveFeedMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, Pick<AppBskyActorDefs.SavedFeed, 'id'>>({
    mutationFn: async savedFeed => {
      await getAgent().removeSavedFeeds([savedFeed.id])
      track('CustomFeed:Unsave')
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpdateSavedFeedsMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, AppBskyActorDefs.SavedFeed[]>({
    mutationFn: async feeds => {
      await getAgent().updateSavedFeeds(feeds)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpsertMutedWordsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mutedWords: AppBskyActorDefs.MutedWord[]) => {
      await getAgent().upsertMutedWords(mutedWords)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useUpdateMutedWordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mutedWord: AppBskyActorDefs.MutedWord) => {
      await getAgent().updateMutedWord(mutedWord)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useRemoveMutedWordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mutedWord: AppBskyActorDefs.MutedWord) => {
      await getAgent().removeMutedWord(mutedWord)
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

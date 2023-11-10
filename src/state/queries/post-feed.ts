import {useCallback, useMemo} from 'react'
import {AppBskyFeedDefs, AppBskyFeedPost, moderatePost} from '@atproto/api'
import {useInfiniteQuery, InfiniteData, QueryKey} from '@tanstack/react-query'
import {useSession} from '../session'
import {useFeedTuners} from '../preferences/feed-tuners'
import {FeedTuner, NoopFeedTuner} from 'lib/api/feed-manip'
import {FeedAPI} from 'lib/api/feed/types'
import {FollowingFeedAPI} from 'lib/api/feed/following'
import {AuthorFeedAPI} from 'lib/api/feed/author'
import {LikesFeedAPI} from 'lib/api/feed/likes'
import {CustomFeedAPI} from 'lib/api/feed/custom'
import {ListFeedAPI} from 'lib/api/feed/list'
import {MergeFeedAPI} from 'lib/api/feed/merge'
import {useStores} from '../models/root-store'

type ActorDid = string
type AuthorFilter =
  | 'posts_with_replies'
  | 'posts_no_replies'
  | 'posts_with_media'
type FeedUri = string
type ListUri = string
export type FeedDescriptor =
  | 'home'
  | 'following'
  | `author|${ActorDid}|${AuthorFilter}`
  | `feedgen|${FeedUri}`
  | `likes|${ActorDid}`
  | `list|${ListUri}`

type RQPageParam = string | undefined

export function RQKEY(feedDesc: FeedDescriptor) {
  return ['post-feed', feedDesc]
}

export interface FeedPostSliceItem {
  _reactKey: string
  uri: string
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  reason?: AppBskyFeedDefs.ReasonRepost
}

export interface FeedPostSlice {
  _reactKey: string
  rootUri: string
  isThread: boolean
  source: undefined // TODO
  items: FeedPostSliceItem[]
}

export interface FeedPage {
  cursor: string | undefined
  slices: FeedPostSlice[]
}

export function usePostFeedQuery(
  feedDesc: FeedDescriptor,
  opts?: {enabled?: boolean; disableTuner?: boolean},
) {
  const {agent} = useSession()
  const feedTuners = useFeedTuners(feedDesc)
  const store = useStores()
  const enabled = opts?.enabled !== false

  const api: FeedAPI = useMemo(() => {
    if (feedDesc === 'home') {
      return new MergeFeedAPI(agent)
    } else if (feedDesc === 'following') {
      return new FollowingFeedAPI(agent)
    } else if (feedDesc.startsWith('author')) {
      const [_, actor, filter] = feedDesc.split('|')
      return new AuthorFeedAPI(agent, {actor, filter})
    } else if (feedDesc.startsWith('likes')) {
      const [_, actor] = feedDesc.split('|')
      return new LikesFeedAPI(agent, {actor})
    } else if (feedDesc.startsWith('feedgen')) {
      const [_, feed] = feedDesc.split('|')
      return new CustomFeedAPI(agent, {feed})
    } else if (feedDesc.startsWith('list')) {
      const [_, list] = feedDesc.split('|')
      return new ListFeedAPI(agent, {list})
    } else {
      // shouldnt happen
      return new FollowingFeedAPI(agent)
    }
  }, [feedDesc, agent])
  const tuner = useMemo(
    () => (opts?.disableTuner ? new NoopFeedTuner() : new FeedTuner()),
    [opts?.disableTuner],
  )

  const pollLatest = useCallback(async () => {
    if (!enabled) {
      return false
    }
    console.log('polling')
    const post = await api.peekLatest()
    if (post) {
      const slices = tuner.tune([post], feedTuners, {
        dryRun: true,
        maintainOrder: true,
      })
      if (slices[0]) {
        if (
          !moderatePost(
            slices[0].items[0].post,
            store.preferences.moderationOpts,
          ).content.filter
        ) {
          return true
        }
      }
    }
    return false
  }, [api, tuner, feedTuners, store.preferences.moderationOpts, enabled])

  const out = useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(feedDesc),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      console.log('fetch', feedDesc, pageParam)
      if (!pageParam) {
        tuner.reset()
      }
      const res = await api.fetch({cursor: pageParam, limit: 30})
      const slices = tuner.tune(res.feed, feedTuners)
      return {
        cursor: res.cursor,
        slices: slices.map(slice => ({
          _reactKey: slice._reactKey,
          rootUri: slice.rootItem.post.uri,
          isThread:
            slice.items.length > 1 &&
            slice.items.every(
              item => item.post.author.did === slice.items[0].post.author.did,
            ),
          source: undefined, // TODO
          items: slice.items
            .map((item, i) => {
              if (
                AppBskyFeedPost.isRecord(item.post.record) &&
                AppBskyFeedPost.validateRecord(item.post.record).success
              ) {
                return {
                  _reactKey: `${slice._reactKey}-${i}`,
                  uri: item.post.uri,
                  post: item.post,
                  record: item.post.record,
                  reason: item.reason,
                }
              }
              return undefined
            })
            .filter(Boolean) as FeedPostSliceItem[],
        })),
      }
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled,
  })

  return {...out, pollLatest}
}

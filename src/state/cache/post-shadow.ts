import {useEffect, useMemo, useState} from 'react'
import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
} from '@atproto/api'
import {QueryClient} from '@tanstack/react-query'
import EventEmitter from 'eventemitter3'

import {batchedUpdates} from '#/lib/batchedUpdates'
import {findAllPostsInQueryData as findAllPostsInNotifsQueryData} from '../queries/notifications/feed'
import {findAllPostsInQueryData as findAllPostsInFeedQueryData} from '../queries/post-feed'
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '../queries/post-quotes'
import {findAllPostsInQueryData as findAllPostsInThreadQueryData} from '../queries/post-thread'
import {findAllPostsInQueryData as findAllPostsInSearchQueryData} from '../queries/search-posts'
import {castAsShadow, Shadow} from './types'
export type {Shadow} from './types'

export interface PostShadow {
  likeUri: string | undefined
  repostUri: string | undefined
  isDeleted: boolean
  embed: AppBskyEmbedRecord.View | AppBskyEmbedRecordWithMedia.View | undefined
  pinned: boolean
}

export const POST_TOMBSTONE = Symbol('PostTombstone')

const emitter = new EventEmitter()
const shadows: Map<string, Partial<PostShadow>> = new Map()

export function usePostShadow(
  post: AppBskyFeedDefs.PostView,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  const {uri} = post
  const [shadow, setShadow] = useState(() => shadows.get(uri))
  const [prevPost, setPrevPost] = useState(post)
  if (post !== prevPost) {
    setPrevPost(post)
    setShadow(shadows.get(uri))
  }

  useEffect(() => {
    function onUpdate() {
      setShadow(shadows.get(uri))
    }
    emitter.addListener(uri, onUpdate)
    return () => {
      emitter.removeListener(uri, onUpdate)
    }
  }, [uri, setShadow])

  return useMemo(() => {
    if (shadow) {
      return mergeShadow(post, shadow)
    } else {
      return castAsShadow(post)
    }
  }, [post, shadow])
}

function mergeShadow(
  post: AppBskyFeedDefs.PostView,
  shadow: Partial<PostShadow>,
): Shadow<AppBskyFeedDefs.PostView> | typeof POST_TOMBSTONE {
  if (shadow.isDeleted) {
    return POST_TOMBSTONE
  }

  let likeCount = post.likeCount ?? 0
  if ('likeUri' in shadow) {
    const wasLiked = !!post.viewer?.like
    const isLiked = !!shadow.likeUri
    if (wasLiked && !isLiked) {
      likeCount--
    } else if (!wasLiked && isLiked) {
      likeCount++
    }
    likeCount = Math.max(0, likeCount)
  }

  let repostCount = post.repostCount ?? 0
  if ('repostUri' in shadow) {
    const wasReposted = !!post.viewer?.repost
    const isReposted = !!shadow.repostUri
    if (wasReposted && !isReposted) {
      repostCount--
    } else if (!wasReposted && isReposted) {
      repostCount++
    }
    repostCount = Math.max(0, repostCount)
  }

  let embed: typeof post.embed
  if ('embed' in shadow) {
    if (
      (AppBskyEmbedRecord.isView(post.embed) &&
        AppBskyEmbedRecord.isView(shadow.embed)) ||
      (AppBskyEmbedRecordWithMedia.isView(post.embed) &&
        AppBskyEmbedRecordWithMedia.isView(shadow.embed))
    ) {
      embed = shadow.embed
    }
  }

  return castAsShadow({
    ...post,
    embed: embed || post.embed,
    likeCount: likeCount,
    repostCount: repostCount,
    viewer: {
      ...(post.viewer || {}),
      like: 'likeUri' in shadow ? shadow.likeUri : post.viewer?.like,
      repost: 'repostUri' in shadow ? shadow.repostUri : post.viewer?.repost,
      pinned: 'pinned' in shadow ? shadow.pinned : post.viewer?.pinned,
    },
  })
}

export function updatePostShadow(
  queryClient: QueryClient,
  uri: string,
  value: Partial<PostShadow>,
) {
  const cachedPosts = findPostsInCache(queryClient, uri)
  for (let post of cachedPosts) {
    shadows.set(post.uri, {...shadows.get(post.uri), ...value})
  }
  batchedUpdates(() => {
    emitter.emit(uri)
  })
}

function* findPostsInCache(
  queryClient: QueryClient,
  uri: string,
): Generator<AppBskyFeedDefs.PostView, void> {
  for (let post of findAllPostsInFeedQueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInNotifsQueryData(queryClient, uri)) {
    yield post
  }
  for (let node of findAllPostsInThreadQueryData(queryClient, uri)) {
    if (node.type === 'post') {
      yield node.post
    }
  }
  for (let post of findAllPostsInSearchQueryData(queryClient, uri)) {
    yield post
  }
  for (let post of findAllPostsInQuoteQueryData(queryClient, uri)) {
    yield post
  }
}

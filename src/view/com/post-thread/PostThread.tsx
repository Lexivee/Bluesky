import React, {useEffect, useRef} from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {CenteredView} from '../util/Views'
import {LoadingScreen} from '../util/LoadingScreen'
import {List, ListMethods} from '../util/List'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {PostThreadItem} from './PostThreadItem'
import {ComposePrompt} from '../composer/Prompt'
import {ViewHeader} from '../util/ViewHeader'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Text} from '../util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {
  ThreadNode,
  ThreadPost,
  ThreadNotFound,
  ThreadBlocked,
  usePostThreadQuery,
  sortThread,
} from '#/state/queries/post-thread'
import {useNavigation} from '@react-navigation/native'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {cleanError} from '#/lib/strings/errors'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  UsePreferencesQueryResponse,
  useModerationOpts,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {isAndroid, isNative} from '#/platform/detection'
import {logger} from '#/logger'
import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'

const MAINTAIN_VISIBLE_CONTENT_POSITION = {minIndexForVisible: 1}

const TOP_COMPONENT = {_reactKey: '__top_component__'}
const REPLY_PROMPT = {_reactKey: '__reply__'}
const CHILD_SPINNER = {_reactKey: '__child_spinner__'}
const LOAD_MORE = {_reactKey: '__load_more__'}
const BOTTOM_COMPONENT = {_reactKey: '__bottom_component__'}

type YieldedItem = ThreadPost | ThreadBlocked | ThreadNotFound
type RowItem =
  | YieldedItem
  // TODO: TS doesn't actually enforce it's one of these, it only enforces matching shape.
  | typeof TOP_COMPONENT
  | typeof REPLY_PROMPT
  | typeof CHILD_SPINNER
  | typeof LOAD_MORE
  | typeof BOTTOM_COMPONENT

export function PostThread({
  uri,
  onCanReply,
  onPressReply,
}: {
  uri: string | undefined
  onCanReply: (canReply: boolean) => void
  onPressReply: () => void
}) {
  const {
    isLoading,
    isError,
    error,
    refetch,
    data: thread,
  } = usePostThreadQuery(uri)
  const {data: preferences} = usePreferencesQuery()

  const rootPost = thread?.type === 'post' ? thread.post : undefined
  const rootPostRecord = thread?.type === 'post' ? thread.record : undefined

  const moderationOpts = useModerationOpts()
  const isNoPwi = React.useMemo(() => {
    const mod =
      rootPost && moderationOpts
        ? moderatePost(rootPost, moderationOpts)
        : undefined

    const cause = mod?.content.cause

    return cause
      ? cause.type === 'label' && cause.labelDef.id === '!no-unauthenticated'
      : false
  }, [rootPost, moderationOpts])

  useSetTitle(
    rootPost && !isNoPwi
      ? `${sanitizeDisplayName(
          rootPost.author.displayName || `@${rootPost.author.handle}`,
        )}: "${rootPostRecord!.text}"`
      : '',
  )
  useEffect(() => {
    if (rootPost) {
      onCanReply(!rootPost.viewer?.replyDisabled)
    }
  }, [rootPost, onCanReply])

  if (isError || AppBskyFeedDefs.isNotFoundPost(thread)) {
    return (
      <PostThreadError
        error={error}
        notFound={AppBskyFeedDefs.isNotFoundPost(thread)}
        onRefresh={refetch}
      />
    )
  }
  if (AppBskyFeedDefs.isBlockedPost(thread)) {
    return <PostThreadBlocked />
  }
  if (!thread || isLoading || !preferences) {
    return <LoadingScreen />
  }
  return (
    <PostThreadLoaded
      thread={thread}
      threadViewPrefs={preferences.threadViewPrefs}
      onRefresh={refetch}
      onPressReply={onPressReply}
    />
  )
}

function PostThreadLoaded({
  thread,
  threadViewPrefs,
  onRefresh,
  onPressReply,
}: {
  thread: ThreadNode
  threadViewPrefs: UsePreferencesQueryResponse['threadViewPrefs']
  onRefresh: () => void
  onPressReply: () => void
}) {
  const {hasSession} = useSession()
  const {_} = useLingui()
  const pal = usePalette('default')
  const {isMobile, isTabletOrMobile} = useWebMediaQueries()
  const ref = useRef<ListMethods>(null)
  const highlightedPostRef = useRef<View | null>(null)
  const needsScrollAdjustment = useRef<boolean>(
    !isNative || // web always uses scroll adjustment
      (thread.type === 'post' && !thread.ctx.isParentLoading), // native only does it when not loading from placeholder
  )
  const [maxVisible, setMaxVisible] = React.useState(100)
  const [isPTRing, setIsPTRing] = React.useState(false)
  const treeView = React.useMemo(
    () => !!threadViewPrefs.lab_treeViewEnabled && hasBranchingReplies(thread),
    [threadViewPrefs, thread],
  )

  // construct content
  const posts = React.useMemo(() => {
    const root = sortThread(thread, threadViewPrefs)
    let arr: RowItem[] = []
    if (root.type === 'post') {
      if (!root.ctx.isParentLoading) {
        arr.push(TOP_COMPONENT)
        for (const parent of flattenThreadParents(root, hasSession)) {
          arr.push(parent)
        }
      }
      arr.push(root)
      if (!root.post.viewer?.replyDisabled) {
        arr.push(REPLY_PROMPT)
      }
      if (root.ctx.isChildLoading) {
        arr.push(CHILD_SPINNER)
      } else {
        for (const reply of flattenThreadReplies(root, hasSession, treeView)) {
          arr.push(reply)
        }
        arr.push(BOTTOM_COMPONENT)
      }
    }
    if (arr.length > maxVisible) {
      arr = arr.slice(0, maxVisible).concat([LOAD_MORE])
    }
    return arr
  }, [thread, treeView, maxVisible, threadViewPrefs, hasSession])

  /**
   * NOTE
   * Scroll positioning
   *
   * This callback is run if needsScrollAdjustment.current == true, which is...
   *  - On web: always
   *  - On native: when the placeholder cache is not being used
   *
   * It then only runs when viewing a reply, and the goal is to scroll the
   * reply into view.
   *
   * On native, if the placeholder cache is being used then maintainVisibleContentPosition
   * is a more effective solution, so we use that. Otherwise, typically we're loading from
   * the react-query cache, so we just need to immediately scroll down to the post.
   *
   * On desktop, maintainVisibleContentPosition isn't supported so we just always use
   * this technique.
   *
   * -prf
   */
  const onContentSizeChange = React.useCallback(() => {
    // only run once
    if (!needsScrollAdjustment.current) {
      return
    }

    // wait for loading to finish
    if (thread.type === 'post' && !!thread.parent) {
      function onMeasure(pageY: number) {
        ref.current?.scrollToOffset({
          animated: false,
          offset: pageY,
        })
      }
      if (isNative) {
        highlightedPostRef.current?.measure(
          (_x, _y, _width, _height, _pageX, pageY) => {
            onMeasure(pageY)
          },
        )
      } else {
        // Measure synchronously to avoid a layout jump.
        const domNode = highlightedPostRef.current
        if (domNode) {
          const pageY = (domNode as any as Element).getBoundingClientRect().top
          onMeasure(pageY)
        }
      }
      needsScrollAdjustment.current = false
    }
  }, [thread])

  const onPTR = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await onRefresh()
    } catch (err) {
      logger.error('Failed to refresh posts thread', {message: err})
    }
    setIsPTRing(false)
  }, [setIsPTRing, onRefresh])

  const renderItem = React.useCallback(
    ({item, index}: {item: RowItem; index: number}) => {
      if (item === TOP_COMPONENT) {
        return isTabletOrMobile ? (
          <ViewHeader
            title={_(msg({message: `Post`, context: 'description'}))}
          />
        ) : null
      } else if (item === REPLY_PROMPT && hasSession) {
        return (
          <View>
            {!isMobile && <ComposePrompt onPressCompose={onPressReply} />}
          </View>
        )
      } else if (isThreadNotFound(item)) {
        return (
          <View style={[pal.border, pal.viewLight, styles.itemContainer]}>
            <Text type="lg-bold" style={pal.textLight}>
              <Trans>Deleted post.</Trans>
            </Text>
          </View>
        )
      } else if (isThreadBlocked(item)) {
        return (
          <View style={[pal.border, pal.viewLight, styles.itemContainer]}>
            <Text type="lg-bold" style={pal.textLight}>
              <Trans>Blocked post.</Trans>
            </Text>
          </View>
        )
      } else if (item === LOAD_MORE) {
        return (
          <Pressable
            onPress={() => setMaxVisible(n => n + 50)}
            style={[pal.border, pal.view, styles.itemContainer]}
            accessibilityLabel={_(msg`Load more posts`)}
            accessibilityHint="">
            <View
              style={[
                pal.viewLight,
                {paddingHorizontal: 18, paddingVertical: 14, borderRadius: 6},
              ]}>
              <Text type="lg-medium" style={pal.text}>
                <Trans>Load more posts</Trans>
              </Text>
            </View>
          </Pressable>
        )
      } else if (item === BOTTOM_COMPONENT) {
        // HACK
        // due to some complexities with how flatlist works, this is the easiest way
        // I could find to get a border positioned directly under the last item
        // -prf
        return (
          <View
            // @ts-ignore web-only
            style={{
              // Leave enough space below that the scroll doesn't jump
              height: isNative ? 600 : '100vh',
              borderTopWidth: 1,
              borderColor: pal.colors.border,
            }}
          />
        )
      } else if (item === CHILD_SPINNER) {
        return (
          <View style={[pal.border, styles.childSpinner]}>
            <ActivityIndicator />
          </View>
        )
      } else if (isThreadPost(item)) {
        const prev = isThreadPost(posts[index - 1])
          ? (posts[index - 1] as ThreadPost)
          : undefined
        const next = isThreadPost(posts[index - 1])
          ? (posts[index - 1] as ThreadPost)
          : undefined
        return (
          <View
            ref={item.ctx.isHighlightedPost ? highlightedPostRef : undefined}>
            <PostThreadItem
              post={item.post}
              record={item.record}
              treeView={treeView}
              depth={item.ctx.depth}
              prevPost={prev}
              nextPost={next}
              isHighlightedPost={item.ctx.isHighlightedPost}
              hasMore={item.ctx.hasMore}
              showChildReplyLine={item.ctx.showChildReplyLine}
              showParentReplyLine={item.ctx.showParentReplyLine}
              hasPrecedingItem={!!prev?.ctx.showChildReplyLine}
              onPostReply={onRefresh}
            />
          </View>
        )
      }
      return null
    },
    [
      hasSession,
      isTabletOrMobile,
      isMobile,
      onPressReply,
      pal.border,
      pal.viewLight,
      pal.textLight,
      pal.view,
      pal.text,
      pal.colors.border,
      posts,
      onRefresh,
      treeView,
      _,
    ],
  )

  return (
    <List
      ref={ref}
      data={posts}
      initialNumToRender={!isNative ? posts.length : undefined}
      maintainVisibleContentPosition={
        !needsScrollAdjustment.current
          ? MAINTAIN_VISIBLE_CONTENT_POSITION
          : undefined
      }
      keyExtractor={item => item._reactKey}
      renderItem={renderItem}
      refreshing={isPTRing}
      onRefresh={onPTR}
      onContentSizeChange={onContentSizeChange}
      style={s.hContentRegion}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
      removeClippedSubviews={isAndroid ? false : undefined}
    />
  )
}

function PostThreadBlocked() {
  const {_} = useLingui()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  return (
    <CenteredView>
      <View style={[pal.view, pal.border, styles.notFoundContainer]}>
        <Text type="title-lg" style={[pal.text, s.mb5]}>
          <Trans>Post hidden</Trans>
        </Text>
        <Text type="md" style={[pal.text, s.mb10]}>
          <Trans>
            You have blocked the author or you have been blocked by the author.
          </Trans>
        </Text>
        <TouchableOpacity
          onPress={onPressBack}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Back`)}
          accessibilityHint="">
          <Text type="2xl" style={pal.link}>
            <FontAwesomeIcon
              icon="angle-left"
              style={[pal.link as FontAwesomeIconStyle, s.mr5]}
              size={14}
            />
            <Trans context="action">Back</Trans>
          </Text>
        </TouchableOpacity>
      </View>
    </CenteredView>
  )
}

function PostThreadError({
  onRefresh,
  notFound,
  error,
}: {
  onRefresh: () => void
  notFound: boolean
  error: Error | null
}) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  if (notFound) {
    return (
      <CenteredView>
        <View style={[pal.view, pal.border, styles.notFoundContainer]}>
          <Text type="title-lg" style={[pal.text, s.mb5]}>
            <Trans>Post not found</Trans>
          </Text>
          <Text type="md" style={[pal.text, s.mb10]}>
            <Trans>The post may have been deleted.</Trans>
          </Text>
          <TouchableOpacity
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Back`)}
            accessibilityHint="">
            <Text type="2xl" style={pal.link}>
              <FontAwesomeIcon
                icon="angle-left"
                style={[pal.link as FontAwesomeIconStyle, s.mr5]}
                size={14}
              />
              <Trans>Back</Trans>
            </Text>
          </TouchableOpacity>
        </View>
      </CenteredView>
    )
  }
  return (
    <CenteredView>
      <ErrorMessage message={cleanError(error)} onPressTryAgain={onRefresh} />
    </CenteredView>
  )
}

function isThreadPost(v: unknown): v is ThreadPost {
  return !!v && typeof v === 'object' && 'type' in v && v.type === 'post'
}

function isThreadNotFound(v: unknown): v is ThreadNotFound {
  return !!v && typeof v === 'object' && 'type' in v && v.type === 'not-found'
}

function isThreadBlocked(v: unknown): v is ThreadBlocked {
  return !!v && typeof v === 'object' && 'type' in v && v.type === 'blocked'
}

function* flattenThreadParents(
  node: ThreadNode,
  hasSession: boolean,
): Generator<YieldedItem, void> {
  if (node.type === 'post') {
    if (node.parent) {
      yield* flattenThreadParents(node.parent, hasSession)
    }
    if (!node.ctx.isHighlightedPost) {
      yield node
    }
  } else if (node.type === 'not-found') {
    yield node
  } else if (node.type === 'blocked') {
    yield node
  }
}

function* flattenThreadReplies(
  node: ThreadNode,
  hasSession: boolean,
  treeView: boolean,
): Generator<YieldedItem, void> {
  if (node.type === 'post') {
    if (!hasSession && hasPwiOptOut(node)) {
      return
    }
    if (!node.ctx.isHighlightedPost) {
      yield node
    }
    if (node.replies?.length) {
      for (const reply of node.replies) {
        yield* flattenThreadReplies(reply, hasSession, treeView)
        if (!treeView && !node.ctx.isHighlightedPost) {
          break
        }
      }
    }
  } else if (node.type === 'not-found') {
    yield node
  } else if (node.type === 'blocked') {
    yield node
  }
}

function hasPwiOptOut(node: ThreadPost) {
  return !!node.post.author.labels?.find(l => l.val === '!no-unauthenticated')
}

function hasBranchingReplies(node: ThreadNode) {
  if (node.type !== 'post') {
    return false
  }
  if (!node.replies) {
    return false
  }
  if (node.replies.length === 1) {
    return hasBranchingReplies(node.replies[0])
  }
  return true
}

const styles = StyleSheet.create({
  notFoundContainer: {
    margin: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
  itemContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  childSpinner: {
    borderTopWidth: 1,
    paddingTop: 40,
    paddingBottom: 200,
  },
})

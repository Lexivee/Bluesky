import React, {memo, MutableRefObject} from 'react'
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {useQueryClient} from '@tanstack/react-query'
import {FlatList} from '../util/Views'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {FeedErrorMessage} from './FeedErrorMessage'
import {FeedSlice} from './FeedSlice'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {OnScrollHandler} from 'lib/hooks/useOnMainScroll'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {useTheme} from 'lib/ThemeContext'
import {logger} from '#/logger'
import {
  RQKEY,
  FeedDescriptor,
  FeedParams,
  usePostFeedQuery,
  pollLatest,
} from '#/state/queries/post-feed'
import {isWeb} from '#/platform/detection'
import {listenPostCreated} from '#/state/events'
import {useSession} from '#/state/session'

const LOADING_ITEM = {_reactKey: '__loading__'}
const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

let Feed = ({
  feed,
  feedParams,
  ignoreFilterFor,
  style,
  enabled,
  pollInterval,
  scrollElRef,
  onScroll,
  onHasNew,
  scrollEventThrottle,
  renderEmptyState,
  renderEndOfFeed,
  testID,
  headerOffset = 0,
  desktopFixedHeightOffset,
  ListHeaderComponent,
  extraData,
}: {
  feed: FeedDescriptor
  feedParams?: FeedParams
  ignoreFilterFor?: string
  style?: StyleProp<ViewStyle>
  enabled?: boolean
  pollInterval?: number
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onHasNew?: (v: boolean) => void
  onScroll?: OnScrollHandler
  scrollEventThrottle?: number
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
  testID?: string
  headerOffset?: number
  desktopFixedHeightOffset?: number
  ListHeaderComponent?: () => JSX.Element
  extraData?: any
}): React.ReactNode => {
  const pal = usePalette('default')
  const theme = useTheme()
  const {track} = useAnalytics()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const checkForNewRef = React.useRef<(() => void) | null>(null)

  const opts = React.useMemo(
    () => ({enabled, ignoreFilterFor}),
    [enabled, ignoreFilterFor],
  )
  const {
    data,
    isFetching,
    isFetched,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePostFeedQuery(feed, feedParams, opts)
  const isEmpty = !isFetching && !data?.pages[0]?.slices.length

  const checkForNew = React.useCallback(async () => {
    if (!data?.pages[0] || isFetching || !onHasNew || !enabled) {
      return
    }
    try {
      if (await pollLatest(data.pages[0])) {
        onHasNew(true)
      }
    } catch (e) {
      logger.error('Poll latest failed', {feed, error: String(e)})
    }
  }, [feed, data, isFetching, onHasNew, enabled])

  const myDid = currentAccount?.did || ''
  const onPostCreated = React.useCallback(() => {
    // NOTE
    // only invalidate if there's 1 page
    // more than 1 page can trigger some UI freakouts on iOS and android
    // -prf
    if (
      data?.pages.length === 1 &&
      (feed === 'following' ||
        feed === 'home' ||
        feed === `author|${myDid}|posts_no_replies`)
    ) {
      queryClient.invalidateQueries({queryKey: RQKEY(feed)})
    }
  }, [queryClient, feed, data, myDid])
  React.useEffect(() => {
    return listenPostCreated(onPostCreated)
  }, [onPostCreated])

  React.useEffect(() => {
    // we store the interval handler in a ref to avoid needless
    // reassignments of the interval
    checkForNewRef.current = checkForNew
  }, [checkForNew])
  React.useEffect(() => {
    if (!pollInterval) {
      return
    }
    const i = setInterval(() => checkForNewRef.current?.(), pollInterval)
    return () => clearInterval(i)
  }, [pollInterval])

  const feedItems = React.useMemo(() => {
    let arr: any[] = []
    if (isFetched) {
      if (isError && isEmpty) {
        arr = arr.concat([ERROR_ITEM])
      }
      if (isEmpty) {
        arr = arr.concat([EMPTY_FEED_ITEM])
      } else if (data) {
        for (const page of data?.pages) {
          arr = arr.concat(page.slices)
        }
      }
      if (isError && !isEmpty) {
        arr = arr.concat([LOAD_MORE_ERROR_ITEM])
      }
    } else {
      arr.push(LOADING_ITEM)
    }
    return arr
  }, [isFetched, isError, isEmpty, data])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    track('Feed:onRefresh')
    setIsPTRing(true)
    try {
      await refetch()
      onHasNew?.(false)
    } catch (err) {
      logger.error('Failed to refresh posts feed', {error: err})
    }
    setIsPTRing(false)
  }, [refetch, track, setIsPTRing, onHasNew])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return

    track('Feed:onEndReached')
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more posts', {error: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage, track])

  const onPressTryAgain = React.useCallback(() => {
    refetch()
    onHasNew?.(false)
  }, [refetch, onHasNew])

  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  // rendering
  // =

  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY_FEED_ITEM) {
        return renderEmptyState()
      } else if (item === ERROR_ITEM) {
        return (
          <FeedErrorMessage
            feedDesc={feed}
            error={error ?? undefined}
            onPressTryAgain={onPressTryAgain}
          />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label="There was an issue fetching posts. Tap here to try again."
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING_ITEM) {
        return <PostFeedLoadingPlaceholder />
      }
      return <FeedSlice slice={item} />
    },
    [feed, error, onPressTryAgain, onPressRetryLoadMore, renderEmptyState],
  )

  const shouldRenderEndOfFeed =
    !hasNextPage && !isEmpty && !isFetching && !isError && !!renderEndOfFeed
  const FeedFooter = React.useCallback(() => {
    /**
     * A bit of padding at the bottom of the feed as you scroll and when you
     * reach the end, so that content isn't cut off by the bottom of the
     * screen.
     */
    const offset = Math.max(headerOffset, 32) * (isWeb ? 1 : 2)

    return isFetchingNextPage ? (
      <View style={[styles.feedFooter]}>
        <ActivityIndicator />
        <View style={{height: offset}} />
      </View>
    ) : shouldRenderEndOfFeed ? (
      <View style={{minHeight: offset}}>{renderEndOfFeed()}</View>
    ) : (
      <View style={{height: offset}} />
    )
  }, [isFetchingNextPage, shouldRenderEndOfFeed, renderEndOfFeed, headerOffset])

  const scrollHandler = useAnimatedScrollHandler(onScroll || {})
  return (
    <View testID={testID} style={style}>
      <FlatList
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={feedItems}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
        ListFooterComponent={FeedFooter}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl
            refreshing={isPTRing}
            onRefresh={onRefresh}
            tintColor={pal.colors.text}
            titleColor={pal.colors.text}
            progressViewOffset={headerOffset}
          />
        }
        contentContainerStyle={{
          minHeight: Dimensions.get('window').height * 1.5,
        }}
        style={{paddingTop: headerOffset}}
        onScroll={onScroll != null ? scrollHandler : undefined}
        scrollEventThrottle={scrollEventThrottle}
        indicatorStyle={theme.colorScheme === 'dark' ? 'white' : 'black'}
        onEndReached={onEndReached}
        onEndReachedThreshold={2} // number of posts left to trigger load more
        removeClippedSubviews={true}
        contentOffset={{x: 0, y: headerOffset * -1}}
        extraData={extraData}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight={
          desktopFixedHeightOffset ? desktopFixedHeightOffset : true
        }
      />
    </View>
  )
}
Feed = memo(Feed)
export {Feed}

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
})

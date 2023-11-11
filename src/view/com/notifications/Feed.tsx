import React, {MutableRefObject, PropsWithChildren} from 'react'
import {observer} from 'mobx-react-lite'
import {CenteredView, FlatList} from '../util/Views'
import {
  ActivityIndicator,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {NotificationsFeedModel} from 'state/models/feeds/notifications'
import {FeedItem} from './FeedItem'
import {NotificationFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'
import {EmptyState} from '../util/EmptyState'
import {OnScrollHandler} from 'lib/hooks/useOnMainScroll'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {logger} from '#/logger'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}
const LOADING_SPINNER = {_reactKey: '__loading_spinner__'}

export const Feed = observer(function Feed({
  view,
  scrollElRef,
  onPressTryAgain,
  onScroll,
  ListHeaderComponent,
}: {
  view: NotificationsFeedModel
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressTryAgain?: () => void
  onScroll?: OnScrollHandler
  ListHeaderComponent?: () => JSX.Element
}) {
  const pal = usePalette('default')
  const [isPTRing, setIsPTRing] = React.useState(false)
  const data = React.useMemo(() => {
    let feedItems: any[] = []
    if (view.isRefreshing && !isPTRing) {
      feedItems = [LOADING_SPINNER]
    }
    if (view.hasLoaded) {
      if (view.isEmpty) {
        feedItems = feedItems.concat([EMPTY_FEED_ITEM])
      } else {
        feedItems = feedItems.concat(view.notifications)
      }
    }
    if (view.loadMoreError) {
      feedItems = (feedItems || []).concat([LOAD_MORE_ERROR_ITEM])
    }
    return feedItems
  }, [
    view.hasLoaded,
    view.isEmpty,
    view.notifications,
    view.loadMoreError,
    view.isRefreshing,
    isPTRing,
  ])

  const onRefresh = React.useCallback(async () => {
    try {
      setIsPTRing(true)
      await view.refresh()
    } catch (err) {
      logger.error('Failed to refresh notifications feed', {
        error: err,
      })
    } finally {
      setIsPTRing(false)
    }
  }, [view, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    try {
      await view.loadMore()
    } catch (err) {
      logger.error('Failed to load more notifications', {
        error: err,
      })
    }
  }, [view])

  const onPressRetryLoadMore = React.useCallback(() => {
    view.retryLoadMore()
  }, [view])

  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY_FEED_ITEM) {
        return (
          <EmptyState
            icon="bell"
            message="No notifications yet!"
            style={styles.emptyState}
          />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label="There was an issue fetching notifications. Tap here to try again."
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING_SPINNER) {
        return (
          <View style={styles.loading}>
            <ActivityIndicator size="small" />
          </View>
        )
      }
      return <FeedItem item={item} />
    },
    [onPressRetryLoadMore],
  )

  // Ref: https://github.com/hossein-zare/react-native-dropdown-picker/issues/376#issuecomment-1717443831
  const renderCell = React.useCallback(
    ({
      children,
      index,
      style,
      ...props
    }: PropsWithChildren<{
      style: StyleProp<ViewStyle>
      [key: string]: any
    }>) => {
      return (
        // static value didn't work, somehow using the dynamic index makes it work
        <View style={[style, {zIndex: -1 * index}]} {...props}>
          {children}
        </View>
      )
    },
    [],
  )

  const FeedFooter = React.useCallback(
    () =>
      view.isLoading ? (
        <View style={styles.feedFooter}>
          <ActivityIndicator />
        </View>
      ) : (
        <View />
      ),
    [view],
  )

  const scrollHandler = useAnimatedScrollHandler(onScroll || {})
  return (
    <View style={s.hContentRegion}>
      <CenteredView>
        {view.isLoading && !data.length && (
          <NotificationFeedLoadingPlaceholder />
        )}
        {view.hasError && (
          <ErrorMessage
            message={view.error}
            onPressTryAgain={onPressTryAgain}
          />
        )}
      </CenteredView>
      {data.length ? (
        <FlatList
          testID="notifsFeed"
          ref={scrollElRef}
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          CellRendererComponent={renderCell}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={FeedFooter}
          refreshControl={
            <RefreshControl
              refreshing={isPTRing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          onScroll={scrollHandler}
          scrollEventThrottle={1}
          contentContainerStyle={s.contentContainer}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
        />
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 20,
  },
  feedFooter: {paddingTop: 20},
  emptyState: {paddingVertical: 40},
})

import React, {MutableRefObject, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  View,
  FlatList,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import {PostFeedLoadingPlaceholder} from '../util/LoadingPlaceholder'
import {EmptyState} from '../util/EmptyState'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {FeedModel} from '../../../state/models/feed-view'
import {FeedItem} from './FeedItem'
import {OnScrollCb} from '../../lib/hooks/useOnMainScroll'
import {s} from '../../lib/styles'
import {useAnalytics} from '@segment/analytics-react-native'

const EMPTY_FEED_ITEM = {_reactKey: '__empty__'}

export const Feed = observer(function Feed({
  feed,
  style,
  scrollElRef,
  onPressCompose,
  onPressTryAgain,
  onScroll,
  testID,
}: {
  feed: FeedModel
  style?: StyleProp<ViewStyle>
  scrollElRef?: MutableRefObject<FlatList<any> | null>
  onPressCompose: (imagesOpen?: boolean) => void
  onPressTryAgain?: () => void
  onScroll?: OnScrollCb
  testID?: string
}) {
  const {screen, track} = useAnalytics()

  useEffect(() => {
    screen('Feed')
  }, [screen])

  // TODO optimize renderItem or FeedItem, we're getting this notice from RN: -prf
  //   VirtualizedList: You have a large list that is slow to update - make sure your
  //   renderItem function renders components that follow React performance best practices
  //   like PureComponent, shouldComponentUpdate, etc
  const renderItem = ({item}: {item: any}) => {
    if (item === EMPTY_FEED_ITEM) {
      return (
        <EmptyState
          icon="bars"
          message="This feed is empty!"
          style={styles.emptyState}
        />
      )
    } else {
      return <FeedItem item={item} />
    }
  }
  const onRefresh = () => {
    track('Feed:onRefresh')
    feed
      .refresh()
      .catch(err =>
        feed.rootStore.log.error('Failed to refresh posts feed', err),
      )
  }
  const onEndReached = () => {
    track('Feed:onEndReached')
    feed
      .loadMore()
      .catch(err => feed.rootStore.log.error('Failed to load more posts', err))
  }
  let data
  if (feed.hasLoaded) {
    if (feed.isEmpty) {
      data = [EMPTY_FEED_ITEM]
    } else {
      data = feed.feed.slice()
    }
  }
  const FeedFooter = () =>
    feed.isLoading ? (
      <View style={styles.feedFooter}>
        <ActivityIndicator />
      </View>
    ) : (
      <View />
    )
  return (
    <View testID={testID} style={style}>
      {feed.isLoading && !data && <PostFeedLoadingPlaceholder />}
      {feed.hasError && (
        <ErrorMessage message={feed.error} onPressTryAgain={onPressTryAgain} />
      )}
      {feed.hasLoaded && data && (
        <FlatList
          ref={scrollElRef}
          data={data}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          ListFooterComponent={FeedFooter}
          refreshing={feed.isRefreshing}
          contentContainerStyle={s.contentContainer}
          onScroll={onScroll}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          removeClippedSubviews={true}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  feedFooter: {paddingTop: 20},
  emptyState: {paddingVertical: 40},
})

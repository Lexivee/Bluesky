import React, {memo} from 'react'
import {FlatListProps, RefreshControl, ViewToken} from 'react-native'
import {runOnJS, useSharedValue} from 'react-native-reanimated'

import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {usePalette} from '#/lib/hooks/usePalette'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {useDedupe} from 'lib/hooks/useDedupe'
import {addStyle} from 'lib/styles'
import {isAndroid, isIOS} from 'platform/detection'
import {updateActiveViewAsync} from '../../../../modules/expo-bluesky-swiss-army/src/VisibilityView'
import {FlatList_INTERNAL} from './Views'

export type ListMethods = FlatList_INTERNAL
export type ListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  | 'onMomentumScrollBegin' // Use ScrollContext instead.
  | 'onMomentumScrollEnd' // Use ScrollContext instead.
  | 'onScroll' // Use ScrollContext instead.
  | 'onScrollBeginDrag' // Use ScrollContext instead.
  | 'onScrollEndDrag' // Use ScrollContext instead.
  | 'refreshControl' // Pass refreshing and/or onRefresh instead.
  | 'contentOffset' // Pass headerOffset instead.
> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  headerOffset?: number
  refreshing?: boolean
  onRefresh?: () => void
  onItemSeen?: (item: ItemT) => void
  desktopFixedHeight?: number | boolean
  // Web only prop to contain the scroll to the container rather than the window
  disableFullWindowScroll?: boolean
  sideBorders?: boolean
  mayIncludeVideo?: boolean
}
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>

const SCROLLED_DOWN_LIMIT = 200

function ListImpl<ItemT>(
  {
    onScrolledDownChange,
    refreshing,
    onRefresh,
    onItemSeen,
    headerOffset,
    style,
    mayIncludeVideo,
    ...props
  }: ListProps<ItemT>,
  ref: React.Ref<ListMethods>,
) {
  const isScrolledDown = useSharedValue(false)
  const pal = usePalette('default')
  const dedupe = useDedupe(400)

  function handleScrolledDownChange(didScrollDown: boolean) {
    onScrolledDownChange?.(didScrollDown)
  }

  // Intentionally destructured outside the main thread closure.
  // See https://github.com/bluesky-social/social-app/pull/4108.
  //
  // We are also using this to determine when we should autoplay videos.
  // On Android, there are some performance concerns if we call `updateActiveViewAsync` too often while scrolling.
  // This isn't really a problem with how `updateActiveViewAsync` works, but rather that it will cause too many
  // ExoPlayer instances to be created and destroyed, which is pretty expensive and can cause some jank in the feed.
  // When comparing to Twitter, it seems they are much more conservative with when videos will begin playback than
  // they are on iOS, likely for the same reason.
  //
  // Because we're going to be calling this far less on Android, we will also be extra careful to make sure some video
  // starts playing when we reach the end of a scroll by calling `updateActiveViewAsync` at the end of a scroll (whether
  // the user ending the drag or the momentum ending). These extra calls will _not_ be excessively expensive, since it
  // is guaranteed to only happen once (React Native will only call either `onEndDrag` or `onMomentumEnd`, not both) and
  // any scroll performance jank will not be noticeable, since the scroll has already completed.
  const {
    onBeginDrag: onBeginDragFromContext,
    onEndDrag: onEndDragFromContext,
    onScroll: onScrollFromContext,
    onMomentumEnd: onMomentumEndFromContext,
  } = useScrollHandlers()
  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag(e, ctx) {
      onBeginDragFromContext?.(e, ctx)
    },
    onEndDrag(e, ctx) {
      onEndDragFromContext?.(e, ctx)
      if (mayIncludeVideo && isAndroid) {
        runOnJS(updateActiveViewAsync)()
      }
    },
    onScroll(e, ctx) {
      onScrollFromContext?.(e, ctx)

      const didScrollDown = e.contentOffset.y > SCROLLED_DOWN_LIMIT
      if (isScrolledDown.value !== didScrollDown) {
        isScrolledDown.value = didScrollDown
        if (onScrolledDownChange != null) {
          runOnJS(handleScrolledDownChange)(didScrollDown)
        }
      }

      if (mayIncludeVideo && isIOS) {
        runOnJS(dedupe)(updateActiveViewAsync)
      }
    },
    // Note: adding onMomentumBegin here makes simulator scroll
    // lag on Android. So either don't add it, or figure out why.
    onMomentumEnd(e, ctx) {
      onMomentumEndFromContext?.(e, ctx)
      if (mayIncludeVideo && isAndroid) {
        runOnJS(updateActiveViewAsync)()
      }
    },
  })

  const [onViewableItemsChanged, viewabilityConfig] = React.useMemo(() => {
    if (!onItemSeen) {
      return [undefined, undefined]
    }
    return [
      (info: {viewableItems: Array<ViewToken>; changed: Array<ViewToken>}) => {
        for (const item of info.changed) {
          if (item.isViewable) {
            onItemSeen(item.item)
          }
        }
      },
      {
        itemVisiblePercentThreshold: 40,
        minimumViewTime: 1.5e3,
      },
    ]
  }, [onItemSeen])

  let refreshControl
  if (refreshing !== undefined || onRefresh !== undefined) {
    refreshControl = (
      <RefreshControl
        refreshing={refreshing ?? false}
        onRefresh={onRefresh}
        tintColor={pal.colors.text}
        titleColor={pal.colors.text}
        progressViewOffset={headerOffset}
      />
    )
  }

  let contentOffset
  if (headerOffset != null) {
    style = addStyle(style, {
      paddingTop: headerOffset,
    })
    contentOffset = {x: 0, y: headerOffset * -1}
  }

  return (
    <FlatList_INTERNAL
      {...props}
      scrollIndicatorInsets={{right: 1}}
      contentOffset={contentOffset}
      refreshControl={refreshControl}
      onScroll={scrollHandler}
      scrollEventThrottle={1}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      style={style}
      ref={ref}
    />
  )
}

export const List = memo(React.forwardRef(ListImpl)) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement

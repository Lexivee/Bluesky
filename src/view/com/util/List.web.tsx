import React, {isValidElement, memo, startTransition, useRef} from 'react'
import {FlatListProps, StyleSheet, View, ViewProps} from 'react-native'
import {ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/reanimated2/hook/commonTypes'

import {batchedUpdates} from '#/lib/batchedUpdates'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {addStyle} from 'lib/styles'

export type ListMethods = any // TODO: Better types.
export type ListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  | 'onScroll' // Use ScrollContext instead.
  | 'refreshControl' // Pass refreshing and/or onRefresh instead.
  | 'contentOffset' // Pass headerOffset instead.
> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  headerOffset?: number
  refreshing?: boolean
  onRefresh?: () => void
  onItemSeen?: (item: ItemT) => void
  desktopFixedHeight: any // TODO: Better types.
  containWeb?: boolean
}
export type ListRef = React.MutableRefObject<any | null> // TODO: Better types.

const ON_ITEM_SEEN_WAIT_DURATION = 3e3 // post must be "seen" 3 seconds before capturing
const ON_ITEM_SEEN_INTERSECTION_OPTS = {
  rootMargin: '-200px 0px -200px 0px',
} // post must be 200px visible to be "seen"

function ListImpl<ItemT>(
  {
    ListHeaderComponent,
    ListFooterComponent,
    containWeb,
    contentContainerStyle,
    data,
    desktopFixedHeight,
    headerOffset,
    keyExtractor,
    refreshing: _unsupportedRefreshing,
    onStartReached,
    onStartReachedThreshold = 0,
    onEndReached,
    onEndReachedThreshold = 0,
    onRefresh: _unsupportedOnRefresh,
    onScrolledDownChange,
    onContentSizeChange,
    onItemSeen,
    renderItem,
    extraData,
    style,
    ...props
  }: ListProps<ItemT>,
  ref: React.Ref<ListMethods>,
) {
  const contextScrollHandlers = useScrollHandlers()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  if (!isMobile) {
    contentContainerStyle = addStyle(
      contentContainerStyle,
      styles.containerScroll,
    )
  }

  let header: JSX.Element | null = null
  if (ListHeaderComponent != null) {
    if (isValidElement(ListHeaderComponent)) {
      header = ListHeaderComponent
    } else {
      // @ts-ignore Nah it's fine.
      header = <ListHeaderComponent />
    }
  }

  let footer: JSX.Element | null = null
  if (ListFooterComponent != null) {
    if (isValidElement(ListFooterComponent)) {
      footer = ListFooterComponent
    } else {
      // @ts-ignore Nah it's fine.
      footer = <ListFooterComponent />
    }
  }

  if (headerOffset != null) {
    style = addStyle(style, {
      paddingTop: headerOffset,
    })
  }

  const getScrollableNode = React.useCallback(() => {
    if (containWeb) {
      const element = nativeRef.current as HTMLDivElement | null
      if (!element) return

      return {
        get scrollWidth() {
          return element.scrollWidth
        },
        get scrollHeight() {
          return element.scrollHeight
        },
        get clientWidth() {
          return element.clientWidth
        },
        get clientHeight() {
          return element.clientHeight
        },
        get scrollY() {
          return element.scrollTop
        },
        get scrollX() {
          return element.scrollLeft
        },
        scrollTo(options?: ScrollToOptions) {
          element.scrollTo(options)
        },
        scrollBy(options: ScrollToOptions) {
          element.scrollBy(options)
        },
        addEventListener(event: string, handler: any) {
          element.addEventListener(event, handler)
        },
        removeEventListener(event: string, handler: any) {
          element.removeEventListener(event, handler)
        },
      }
    } else {
      return {
        get scrollWidth() {
          return document.documentElement.scrollWidth
        },
        get scrollHeight() {
          return document.documentElement.scrollHeight
        },
        get clientWidth() {
          return window.innerWidth
        },
        get clientHeight() {
          return window.innerHeight
        },
        get scrollY() {
          return window.scrollY
        },
        get scrollX() {
          return window.scrollX
        },
        scrollTo(options: ScrollToOptions) {
          window.scrollTo(options)
        },
        scrollBy(options: ScrollToOptions) {
          window.scrollBy(options)
        },
        addEventListener(event: string, handler: any) {
          window.addEventListener(event, handler)
        },
        removeEventListener(event: string, handler: any) {
          window.removeEventListener(event, handler)
        },
      }
    }
  }, [containWeb])

  const nativeRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(
    ref,
    () =>
      ({
        scrollToTop() {
          getScrollableNode()?.scrollTo({top: 0})
        },

        scrollToOffset({
          animated,
          offset,
        }: {
          animated: boolean
          offset: number
        }) {
          getScrollableNode()?.scrollTo({
            left: 0,
            top: offset,
            behavior: animated ? 'smooth' : 'instant',
          })
        },
        scrollToEnd({animated = true}: {animated?: boolean}) {
          const element = getScrollableNode()
          element?.scrollTo({
            left: 0,
            top: element.scrollHeight,
            behavior: animated ? 'smooth' : 'instant',
          })
        },
      } as any), // TODO: Better types.
    [getScrollableNode],
  )

  // --- onContentSizeChange, maintainVisibleContentPosition ---
  const containerRef = useRef(null)
  useResizeObserver(containerRef, onContentSizeChange)

  // --- onScroll ---
  const [isInsideVisibleTree, setIsInsideVisibleTree] = React.useState(false)
  const handleScroll = useNonReactiveCallback(() => {
    if (!isInsideVisibleTree) return

    const element = getScrollableNode()
    contextScrollHandlers.onScroll?.(
      {
        contentOffset: {
          x: Math.max(0, element?.scrollX ?? 0),
          y: Math.max(0, element?.scrollY ?? 0),
        },
        layoutMeasurement: {
          width: element?.clientWidth,
          height: element?.clientHeight,
        },
        contentSize: {
          width: element?.scrollWidth,
          height: element?.scrollHeight,
        },
      } as Exclude<
        ReanimatedScrollEvent,
        | 'velocity'
        | 'eventName'
        | 'zoomScale'
        | 'targetContentOffset'
        | 'contentInset'
      >,
      null as any,
    )
  })

  React.useEffect(() => {
    if (!isInsideVisibleTree) {
      // Prevents hidden tabs from firing scroll events.
      // Only one list is expected to be firing these at a time.
      return
    }

    const element = getScrollableNode()

    element?.addEventListener('scroll', handleScroll)
    return () => {
      element?.removeEventListener('scroll', handleScroll)
    }
  }, [isInsideVisibleTree, handleScroll, containWeb, getScrollableNode])

  // --- onScrolledDownChange ---
  const isScrolledDown = useRef(false)
  function handleAboveTheFoldVisibleChange(isAboveTheFold: boolean) {
    const didScrollDown = !isAboveTheFold
    if (isScrolledDown.current !== didScrollDown) {
      isScrolledDown.current = didScrollDown
      startTransition(() => {
        onScrolledDownChange?.(didScrollDown)
      })
    }
  }

  // --- onStartReached ---
  const onHeadVisibilityChange = useNonReactiveCallback(
    (isHeadVisible: boolean) => {
      if (isHeadVisible) {
        onStartReached?.({
          distanceFromStart: onStartReachedThreshold || 0,
        })
      }
    },
  )

  // --- onEndReached ---
  const onTailVisibilityChange = useNonReactiveCallback(
    (isTailVisible: boolean) => {
      if (isTailVisible) {
        onEndReached?.({
          distanceFromEnd: onEndReachedThreshold || 0,
        })
      }
    },
  )

  return (
    <View
      {...props}
      style={[
        style,
        containWeb && {
          flex: 1,
          // @ts-expect-error web only
          'overflow-y': 'scroll',
        },
      ]}
      ref={nativeRef as any}>
      <Visibility
        onVisibleChange={setIsInsideVisibleTree}
        style={
          // This has position: fixed, so it should always report as visible
          // unless we're within a display: none tree (like a hidden tab).
          styles.parentTreeVisibilityDetector
        }
      />
      <View
        ref={containerRef}
        style={[
          !isMobile && styles.sideBorders,
          contentContainerStyle,
          desktopFixedHeight ? styles.minHeightViewport : null,
          pal.border,
        ]}>
        <Visibility
          root={containWeb ? nativeRef : null}
          onVisibleChange={handleAboveTheFoldVisibleChange}
          style={[styles.aboveTheFoldDetector, {height: headerOffset}]}
        />
        {onStartReached && (
          <Visibility
            root={containWeb ? nativeRef : null}
            onVisibleChange={onHeadVisibilityChange}
            topMargin={(onStartReachedThreshold ?? 0) * 100 + '%'}
          />
        )}
        {header}
        {(data as Array<ItemT>).map((item, index) => {
          const key = keyExtractor!(item, index)
          return (
            <Row<ItemT>
              key={key}
              item={item}
              index={index}
              renderItem={renderItem}
              extraData={extraData}
              onItemSeen={onItemSeen}
            />
          )
        })}
        {onEndReached && (
          <Visibility
            root={containWeb ? nativeRef : null}
            onVisibleChange={onTailVisibilityChange}
            bottomMargin={(onEndReachedThreshold ?? 0) * 100 + '%'}
          />
        )}
        {footer}
      </View>
    </View>
  )
}

function useResizeObserver(
  ref: React.RefObject<Element>,
  onResize: undefined | ((w: number, h: number) => void),
) {
  const handleResize = useNonReactiveCallback(onResize ?? (() => {}))
  const isActive = !!onResize
  React.useEffect(() => {
    if (!isActive) {
      return
    }
    const resizeObserver = new ResizeObserver(entries => {
      batchedUpdates(() => {
        for (let entry of entries) {
          const rect = entry.contentRect
          handleResize(rect.width, rect.height)
        }
      })
    })
    const node = ref.current!
    resizeObserver.observe(node)
    return () => {
      resizeObserver.unobserve(node)
    }
  }, [handleResize, isActive, ref])
}

let Row = function RowImpl<ItemT>({
  item,
  index,
  renderItem,
  extraData: _unused,
  onItemSeen,
}: {
  item: ItemT
  index: number
  renderItem:
    | null
    | undefined
    | ((data: {index: number; item: any; separators: any}) => React.ReactNode)
  extraData: any
  onItemSeen: ((item: any) => void) | undefined
}): React.ReactNode {
  const rowRef = React.useRef(null)
  const intersectionTimeout = React.useRef<NodeJS.Timer | undefined>(undefined)

  const handleIntersection = useNonReactiveCallback(
    (entries: IntersectionObserverEntry[]) => {
      batchedUpdates(() => {
        if (!onItemSeen) {
          return
        }
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!intersectionTimeout.current) {
              intersectionTimeout.current = setTimeout(() => {
                onItemSeen!(item)
              }, ON_ITEM_SEEN_WAIT_DURATION)
            }
          } else {
            if (intersectionTimeout.current) {
              clearTimeout(intersectionTimeout.current)
            }
          }
        })
      })
    },
  )

  React.useEffect(() => {
    if (!onItemSeen) {
      return
    }
    const observer = new IntersectionObserver(
      handleIntersection,
      ON_ITEM_SEEN_INTERSECTION_OPTS,
    )
    const row: Element | null = rowRef.current!
    observer.observe(row)
    return () => {
      observer.unobserve(row)
    }
  }, [handleIntersection, onItemSeen])

  if (!renderItem) {
    return null
  }

  return (
    <View style={styles.row} ref={rowRef}>
      {renderItem({item, index, separators: null as any})}
    </View>
  )
}
Row = React.memo(Row)

let Visibility = ({
  root,
  topMargin = '0px',
  bottomMargin = '0px',
  onVisibleChange,
  style,
}: {
  root?: React.RefObject<HTMLDivElement> | null
  topMargin?: string
  bottomMargin?: string
  onVisibleChange: (isVisible: boolean) => void
  style?: ViewProps['style']
}): React.ReactNode => {
  const tailRef = React.useRef(null)
  const isIntersecting = React.useRef(false)

  const handleIntersection = useNonReactiveCallback(
    (entries: IntersectionObserverEntry[]) => {
      batchedUpdates(() => {
        entries.forEach(entry => {
          if (entry.isIntersecting !== isIntersecting.current) {
            isIntersecting.current = entry.isIntersecting
            onVisibleChange(entry.isIntersecting)
          }
        })
      })
    },
  )

  React.useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: root?.current ?? null,
      rootMargin: `${topMargin} 0px ${bottomMargin} 0px`,
    })
    const tail: Element | null = tailRef.current!
    observer.observe(tail)
    return () => {
      observer.unobserve(tail)
    }
  }, [bottomMargin, handleIntersection, topMargin, root])

  return (
    <View ref={tailRef} style={addStyle(styles.visibilityDetector, style)} />
  )
}
Visibility = React.memo(Visibility)

export const List = memo(React.forwardRef(ListImpl)) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement

// https://stackoverflow.com/questions/7944460/detect-safari-browser
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

const styles = StyleSheet.create({
  sideBorders: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  containerScroll: {
    width: '100%',
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  row: {
    // @ts-ignore web only
    contentVisibility: isSafari ? '' : 'auto', // Safari support for this is buggy.
  },
  minHeightViewport: {
    // @ts-ignore web only
    minHeight: '100vh',
  },
  parentTreeVisibilityDetector: {
    // @ts-ignore web only
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  aboveTheFoldDetector: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Bottom is dynamic.
  },
  visibilityDetector: {
    pointerEvents: 'none',
    zIndex: -1,
  },
})

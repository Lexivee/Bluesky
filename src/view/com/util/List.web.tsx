import React, {isValidElement, memo, startTransition, useRef} from 'react'
import {FlatListProps, StyleSheet, View, ViewProps} from 'react-native'

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
  desktopFixedHeight: any // TODO: Better types.
  containWeb?: boolean
}
export type ListRef = React.MutableRefObject<any | null> // TODO: Better types.

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

  const nativeRef = React.useRef(null)
  React.useImperativeHandle(
    ref,
    () =>
      ({
        scrollToTop() {
          const element = containWeb
            ? (nativeRef.current as HTMLDivElement | null)
            : window

          element?.scrollTo({top: 0})
        },

        scrollToOffset({
          animated,
          offset,
        }: {
          animated: boolean
          offset: number
        }) {
          const element = containWeb
            ? (nativeRef.current as HTMLDivElement | null)
            : window

          element?.scrollTo({
            left: 0,
            top: offset,
            behavior: animated ? 'smooth' : 'instant',
          })
        },

        scrollToEnd({animated = true}: {animated?: boolean}) {
          if (containWeb) {
            const element = nativeRef.current as HTMLDivElement | null
            element?.scrollTo({
              left: 0,
              top: element?.scrollHeight,
              behavior: animated ? 'smooth' : 'instant',
            })
          } else {
            window.scrollTo({
              left: 0,
              top: document.documentElement.scrollHeight,
              behavior: animated ? 'smooth' : 'instant',
            })
          }
        },
      } as any), // TODO: Better types.
    [containWeb],
  )

  // --- onContentSizeChange, maintainVisibleContentPosition ---
  const containerRef = useRef(null)
  useResizeObserver(containerRef, onContentSizeChange)

  // --- onScroll ---
  const [isInsideVisibleTree, setIsInsideVisibleTree] = React.useState(false)
  const handleScroll = useNonReactiveCallback(() => {
    if (!isInsideVisibleTree) return

    // If we are in "contain" mode, scroll events come from the container div rather than the window. We can use the
    // `nativeRef` to get the needed values.
    if (containWeb) {
      const element = nativeRef.current as HTMLDivElement | null
      contextScrollHandlers.onScroll?.(
        {
          contentOffset: {
            x: Math.max(0, element?.scrollLeft ?? 0),
            y: Math.max(0, element?.scrollTop ?? 0),
          },
          layoutMeasurement: {
            width: element?.clientWidth,
            height: element?.clientHeight,
          },
          contentSize: {
            width: element?.scrollWidth,
            height: element?.scrollHeight,
          },
        } as any, // TODO: Better types.
        null as any,
      )
    } else {
      contextScrollHandlers.onScroll?.(
        {
          contentOffset: {
            x: Math.max(0, window.scrollX),
            y: Math.max(0, window.scrollY),
          },
          layoutMeasurement: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          contentSize: {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
          },
        } as any, // TODO: Better types.
        null as any,
      )
    }
  })

  React.useEffect(() => {
    if (!isInsideVisibleTree) {
      // Prevents hidden tabs from firing scroll events.
      // Only one list is expected to be firing these at a time.
      return
    }

    const element = containWeb
      ? (nativeRef.current as HTMLDivElement | null)
      : window

    element?.addEventListener('scroll', handleScroll)
    return () => {
      element?.removeEventListener('scroll', handleScroll)
    }
  }, [isInsideVisibleTree, handleScroll, containWeb])

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
      // @ts-ignore web only
      style={[style, containWeb && {flex: 1, 'overflow-y': 'scroll'}]}
      ref={nativeRef}>
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
          root={containWeb ? nativeRef.current : null}
          onVisibleChange={handleAboveTheFoldVisibleChange}
          style={[styles.aboveTheFoldDetector, {height: headerOffset}]}
        />
        {onStartReached && (
          <Visibility
            root={containWeb ? nativeRef.current : null}
            onVisibleChange={onHeadVisibilityChange}
            topMargin={(onStartReachedThreshold ?? 0) * 100 + '%'}
          />
        )}
        {header}
        {(data as Array<ItemT>).map((item, index) => (
          <Row<ItemT>
            key={keyExtractor!(item, index)}
            item={item}
            index={index}
            renderItem={renderItem}
            extraData={extraData}
          />
        ))}
        {onEndReached && (
          <Visibility
            root={containWeb ? nativeRef.current : null}
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
}: {
  item: ItemT
  index: number
  renderItem:
    | null
    | undefined
    | ((data: {index: number; item: any; separators: any}) => React.ReactNode)
  extraData: any
}): React.ReactNode {
  if (!renderItem) {
    return null
  }
  return (
    <View style={styles.row}>
      {renderItem({item, index, separators: null as any})}
    </View>
  )
}
Row = React.memo(Row)

let Visibility = ({
  root = null,
  topMargin = '0px',
  bottomMargin = '0px',
  onVisibleChange,
  style,
}: {
  root?: Element | null
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
      root,
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

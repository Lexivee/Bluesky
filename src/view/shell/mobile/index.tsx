import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {
  Animated,
  Easing,
  GestureResponderEvent,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native'
import {ScreenContainer, Screen} from 'react-native-screens'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {TABS_ENABLED} from '../../../build-flags'
import {useStores} from '../../../state'
import {
  NavigationModel,
  TabPurpose,
  TabPurposeMainPath,
} from '../../../state/models/navigation'
import {match, MatchResult} from '../../routes'
import {Login} from '../../screens/Login'
import {Menu} from './Menu'
import {Onboard} from '../../screens/Onboard'
import {HorzSwipe} from '../../com/util/gestures/HorzSwipe'
import {Modal} from '../../com/modals/Modal'
import {Lightbox} from '../../com/lightbox/Lightbox'
import {Text} from '../../com/util/text/Text'
import {ErrorBoundary} from '../../com/util/ErrorBoundary'
import {TabsSelector} from './TabsSelector'
import {Composer} from './Composer'
import {s, colors} from 'lib/styles'
import {clamp} from 'lib/numbers'
import {
  GridIcon,
  GridIconSolid,
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon,
  BellIcon,
  BellIconSolid,
} from 'lib/icons'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from '@segment/analytics-react-native'

const Btn = ({
  icon,
  notificationCount,
  tabCount,
  onPress,
  onLongPress,
}: {
  icon:
    | IconProp
    | 'menu'
    | 'menu-solid'
    | 'home'
    | 'home-solid'
    | 'search'
    | 'search-solid'
    | 'bell'
    | 'bell-solid'
  notificationCount?: number
  tabCount?: number
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}) => {
  const pal = usePalette('default')
  let iconEl
  if (icon === 'menu') {
    iconEl = <GridIcon style={[styles.ctrlIcon, pal.text]} />
  } else if (icon === 'menu-solid') {
    iconEl = <GridIconSolid style={[styles.ctrlIcon, pal.text]} />
  } else if (icon === 'home') {
    iconEl = <HomeIcon size={27} style={[styles.ctrlIcon, pal.text]} />
  } else if (icon === 'home-solid') {
    iconEl = <HomeIconSolid size={27} style={[styles.ctrlIcon, pal.text]} />
  } else if (icon === 'search') {
    iconEl = (
      <MagnifyingGlassIcon
        size={28}
        style={[styles.ctrlIcon, pal.text, styles.bumpUpOnePixel]}
      />
    )
  } else if (icon === 'search-solid') {
    iconEl = (
      <MagnifyingGlassIcon
        size={28}
        strokeWidth={3}
        style={[styles.ctrlIcon, pal.text, styles.bumpUpOnePixel]}
      />
    )
  } else if (icon === 'bell') {
    iconEl = (
      <BellIcon
        size={27}
        style={[styles.ctrlIcon, pal.text, styles.bumpUpOnePixel]}
      />
    )
  } else if (icon === 'bell-solid') {
    iconEl = (
      <BellIconSolid
        size={27}
        style={[styles.ctrlIcon, pal.text, styles.bumpUpOnePixel]}
      />
    )
  } else {
    iconEl = (
      <FontAwesomeIcon
        icon={icon}
        size={24}
        style={[styles.ctrlIcon, pal.text]}
      />
    )
  }

  return (
    <TouchableOpacity
      style={styles.ctrl}
      onPress={onLongPress ? onPress : undefined}
      onPressIn={onLongPress ? undefined : onPress}
      onLongPress={onLongPress}>
      {notificationCount ? (
        <View style={styles.notificationCount}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : undefined}
      {tabCount && tabCount > 1 ? (
        <View style={styles.tabCount}>
          <Text style={styles.tabCountLabel}>{tabCount}</Text>
        </View>
      ) : undefined}
      {iconEl}
    </TouchableOpacity>
  )
}

export const MobileShell: React.FC = observer(() => {
  const theme = useTheme()
  const pal = usePalette('default')
  const store = useStores()
  const [isTabsSelectorActive, setTabsSelectorActive] = useState(false)
  const winDim = useWindowDimensions()
  const [menuSwipingDirection, setMenuSwipingDirection] = useState(0)
  const swipeGestureInterp = useAnimatedValue(0)
  const minimalShellInterp = useAnimatedValue(0)
  const tabMenuInterp = useAnimatedValue(0)
  const newTabInterp = useAnimatedValue(0)
  const [isRunningNewTabAnim, setIsRunningNewTabAnim] = useState(false)
  const colorScheme = useColorScheme()
  const safeAreaInsets = useSafeAreaInsets()
  const screenRenderDesc = constructScreenRenderDesc(store.nav)
  const {track} = useAnalytics()

  const onPressHome = () => {
    track('MobileShell:HomeButtonPressed')
    if (store.nav.tab.fixedTabPurpose === TabPurpose.Default) {
      if (!store.nav.tab.canGoBack) {
        store.emitScreenSoftReset()
      } else {
        store.nav.tab.fixedTabReset()
      }
    } else {
      store.nav.switchTo(TabPurpose.Default, false)
      if (store.nav.tab.index === 0) {
        store.nav.tab.fixedTabReset()
      }
    }
  }
  const onPressSearch = () => {
    track('MobileShell:SearchButtonPressed')
    if (store.nav.tab.fixedTabPurpose === TabPurpose.Search) {
      if (!store.nav.tab.canGoBack) {
        store.emitScreenSoftReset()
      } else {
        store.nav.tab.fixedTabReset()
      }
    } else {
      store.nav.switchTo(TabPurpose.Search, false)
      if (store.nav.tab.index === 0) {
        store.nav.tab.fixedTabReset()
      }
    }
  }
  const onPressNotifications = () => {
    track('MobileShell:NotificationsButtonPressed')
    if (store.nav.tab.fixedTabPurpose === TabPurpose.Notifs) {
      if (!store.nav.tab.canGoBack) {
        store.emitScreenSoftReset()
      } else {
        store.nav.tab.fixedTabReset()
      }
    } else {
      store.nav.switchTo(TabPurpose.Notifs, false)
      if (store.nav.tab.index === 0) {
        store.nav.tab.fixedTabReset()
      }
    }
  }
  const onPressTabs = () => toggleTabsMenu(!isTabsSelectorActive)
  const doNewTab = (url: string) => () => store.nav.newTab(url)

  // minimal shell animation
  // =
  useEffect(() => {
    if (store.shell.minimalShellMode) {
      Animated.timing(minimalShellInterp, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    } else {
      Animated.timing(minimalShellInterp, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start()
    }
  }, [minimalShellInterp, store.shell.minimalShellMode])
  const footerMinimalShellTransform = {
    transform: [{translateY: Animated.multiply(minimalShellInterp, 100)}],
  }

  // tab selector animation
  // =
  const toggleTabsMenu = (active: boolean) => {
    if (active) {
      // will trigger the animation below
      setTabsSelectorActive(true)
    } else {
      Animated.timing(tabMenuInterp, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }).start(() => {
        // hide once the animation has finished
        setTabsSelectorActive(false)
      })
    }
  }
  useEffect(() => {
    if (isTabsSelectorActive) {
      // trigger the animation once the tabs selector is rendering
      Animated.timing(tabMenuInterp, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }).start()
    }
  }, [tabMenuInterp, isTabsSelectorActive])

  // new tab animation
  // =
  useEffect(() => {
    if (screenRenderDesc.hasNewTab && !isRunningNewTabAnim) {
      setIsRunningNewTabAnim(true)
    }
  }, [isRunningNewTabAnim, screenRenderDesc.hasNewTab])
  useEffect(() => {
    if (isRunningNewTabAnim) {
      const reset = () => {
        store.nav.tab.setIsNewTab(false)
        setIsRunningNewTabAnim(false)
      }
      Animated.timing(newTabInterp, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }).start(() => {
        reset()
      })
    } else {
      newTabInterp.setValue(0)
    }
  }, [newTabInterp, store.nav.tab, isRunningNewTabAnim])

  // navigation swipes
  // =
  const isMenuActive = store.shell.isMainMenuOpen
  const canSwipeLeft = store.nav.tab.canGoBack || !isMenuActive
  const canSwipeRight = isMenuActive
  const onNavSwipeStartDirection = (dx: number) => {
    if (dx < 0 && !store.nav.tab.canGoBack) {
      setMenuSwipingDirection(dx)
    } else if (dx > 0 && isMenuActive) {
      setMenuSwipingDirection(dx)
    } else {
      setMenuSwipingDirection(0)
    }
  }
  const onNavSwipeEnd = (dx: number) => {
    if (dx < 0) {
      if (store.nav.tab.canGoBack) {
        store.nav.tab.goBack()
      } else {
        store.shell.setMainMenuOpen(true)
      }
    } else if (dx > 0) {
      if (isMenuActive) {
        store.shell.setMainMenuOpen(false)
      }
    }
    setMenuSwipingDirection(0)
  }
  const swipeTranslateX = Animated.multiply(
    swipeGestureInterp,
    winDim.width * -1,
  )
  const swipeTransform = store.nav.tab.canGoBack
    ? {transform: [{translateX: swipeTranslateX}]}
    : undefined
  let shouldRenderMenu = false
  let menuTranslateX
  const menuDrawerWidth = winDim.width - 100
  if (isMenuActive) {
    // menu is active, interpret swipes as closes
    menuTranslateX = Animated.multiply(swipeGestureInterp, menuDrawerWidth * -1)
    shouldRenderMenu = true
  } else if (!store.nav.tab.canGoBack) {
    // at back of history, interpret swipes as opens
    menuTranslateX = Animated.subtract(
      menuDrawerWidth * -1,
      Animated.multiply(swipeGestureInterp, menuDrawerWidth),
    )
    shouldRenderMenu = true
  }
  const menuSwipeTransform = menuTranslateX
    ? {
        transform: [{translateX: menuTranslateX}],
      }
    : undefined
  const swipeOpacity = {
    opacity: swipeGestureInterp.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 0.6, 0],
    }),
  }
  const menuSwipeOpacity =
    menuSwipingDirection !== 0
      ? {
          opacity: swipeGestureInterp.interpolate({
            inputRange: menuSwipingDirection > 0 ? [0, 1] : [-1, 0],
            outputRange: [0.6, 0],
          }),
        }
      : undefined
  // TODO
  // const tabMenuTransform = {
  //   transform: [{translateY: Animated.multiply(tabMenuInterp, -320)}],
  // }
  // const newTabTransform = {
  //   transform: [{scale: newTabInterp}],
  // }

  if (!store.session.hasSession) {
    return (
      <View style={styles.outerContainer}>
        <Login />
        <Modal />
      </View>
    )
  }
  if (store.onboard.isOnboarding) {
    return (
      <View testID="onboardOuterView" style={styles.outerContainer}>
        <View style={styles.innerContainer}>
          <ErrorBoundary>
            <Onboard />
          </ErrorBoundary>
        </View>
      </View>
    )
  }

  const isAtHome =
    store.nav.tab.current.url === TabPurposeMainPath[TabPurpose.Default]
  const isAtSearch =
    store.nav.tab.current.url === TabPurposeMainPath[TabPurpose.Search]
  const isAtNotifications =
    store.nav.tab.current.url === TabPurposeMainPath[TabPurpose.Notifs]

  const screenBg = {
    backgroundColor: theme.colorScheme === 'dark' ? colors.gray7 : colors.gray1,
  }
  return (
    <View testID="mobileShellView" style={[styles.outerContainer, pal.view]}>
      <StatusBar
        barStyle={
          theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'
        }
      />
      <View style={[styles.innerContainer, {paddingTop: safeAreaInsets.top}]}>
        <HorzSwipe
          distThresholdDivisor={2.5}
          useNativeDriver
          panX={swipeGestureInterp}
          swipeEnabled
          canSwipeLeft={canSwipeLeft}
          canSwipeRight={canSwipeRight}
          onSwipeStartDirection={onNavSwipeStartDirection}
          onSwipeEnd={onNavSwipeEnd}>
          <ScreenContainer style={styles.screenContainer}>
            {screenRenderDesc.screens.map(
              ({Com, navIdx, params, key, current, previous}) => {
                if (isMenuActive) {
                  // HACK menu is active, treat current as previous
                  if (previous) {
                    previous = false
                  } else if (current) {
                    current = false
                    previous = true
                  }
                }
                return (
                  <Screen
                    key={key}
                    style={[StyleSheet.absoluteFill]}
                    activityState={current ? 2 : previous ? 1 : 0}>
                    <Animated.View
                      style={
                        current ? [styles.screenMask, swipeOpacity] : undefined
                      }
                    />
                    <Animated.View
                      style={[
                        s.h100pct,
                        screenBg,
                        current
                          ? [
                              swipeTransform,
                              // tabMenuTransform, TODO
                              // isRunningNewTabAnim ? newTabTransform : undefined, TODO
                            ]
                          : undefined,
                      ]}>
                      <ErrorBoundary>
                        <Com
                          params={params}
                          navIdx={navIdx}
                          visible={current}
                        />
                      </ErrorBoundary>
                    </Animated.View>
                  </Screen>
                )
              },
            )}
          </ScreenContainer>
          {isMenuActive || menuSwipingDirection !== 0 ? (
            <TouchableWithoutFeedback
              onPress={() => store.shell.setMainMenuOpen(false)}>
              <Animated.View style={[styles.screenMask, menuSwipeOpacity]} />
            </TouchableWithoutFeedback>
          ) : undefined}
          {shouldRenderMenu && (
            <Animated.View style={[styles.menuDrawer, menuSwipeTransform]}>
              <Menu onClose={() => store.shell.setMainMenuOpen(false)} />
            </Animated.View>
          )}
        </HorzSwipe>
      </View>
      {isTabsSelectorActive ? (
        <View
          style={[
            styles.topBarProtector,
            colorScheme === 'dark' ? styles.topBarProtectorDark : undefined,
            {height: safeAreaInsets.top},
          ]}
        />
      ) : undefined}
      <TabsSelector
        active={isTabsSelectorActive}
        tabMenuInterp={tabMenuInterp}
        onClose={() => toggleTabsMenu(false)}
      />
      <Animated.View
        style={[
          styles.bottomBar,
          pal.view,
          pal.border,
          {paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
          footerMinimalShellTransform,
        ]}>
        <Btn
          icon={isAtHome ? 'home-solid' : 'home'}
          onPress={onPressHome}
          onLongPress={TABS_ENABLED ? doNewTab('/') : undefined}
        />
        <Btn
          icon={isAtSearch ? 'search-solid' : 'search'}
          onPress={onPressSearch}
          onLongPress={TABS_ENABLED ? doNewTab('/') : undefined}
        />
        {TABS_ENABLED ? (
          <Btn
            icon={isTabsSelectorActive ? 'clone' : ['far', 'clone']}
            onPress={onPressTabs}
            tabCount={store.nav.tabCount}
          />
        ) : undefined}
        <Btn
          icon={isAtNotifications ? 'bell-solid' : 'bell'}
          onPress={onPressNotifications}
          onLongPress={TABS_ENABLED ? doNewTab('/notifications') : undefined}
          notificationCount={store.me.notifications.unreadCount}
        />
      </Animated.View>
      <Modal />
      <Lightbox />
      <Composer
        active={store.shell.isComposerActive}
        onClose={() => store.shell.closeComposer()}
        winHeight={winDim.height}
        replyTo={store.shell.composerOpts?.replyTo}
        imagesOpen={store.shell.composerOpts?.imagesOpen}
        onPost={store.shell.composerOpts?.onPost}
      />
    </View>
  )
})

/**
 * This method produces the information needed by the shell to
 * render the current screens with screen-caching behaviors.
 */
type ScreenRenderDesc = MatchResult & {
  key: string
  navIdx: string
  current: boolean
  previous: boolean
  isNewTab: boolean
}
function constructScreenRenderDesc(nav: NavigationModel): {
  icon: IconProp
  hasNewTab: boolean
  screens: ScreenRenderDesc[]
} {
  let hasNewTab = false
  let icon: IconProp = 'magnifying-glass'
  let screens: ScreenRenderDesc[] = []
  for (const tab of nav.tabs) {
    const tabScreens = [
      ...tab.getBackList(5),
      Object.assign({}, tab.current, {index: tab.index}),
    ]
    const parsedTabScreens = tabScreens.map(screen => {
      const isCurrent = nav.isCurrentScreen(tab.id, screen.index)
      const isPrevious = nav.isCurrentScreen(tab.id, screen.index + 1)
      const matchRes = match(screen.url)
      if (isCurrent) {
        icon = matchRes.icon
      }
      hasNewTab = hasNewTab || tab.isNewTab
      return Object.assign(matchRes, {
        key: `t${tab.id}-s${screen.index}`,
        navIdx: `${tab.id}-${screen.id}`,
        current: isCurrent,
        previous: isPrevious,
        isNewTab: tab.isNewTab,
      }) as ScreenRenderDesc
    })
    screens = screens.concat(parsedTabScreens)
  }
  return {
    icon,
    hasNewTab,
    screens,
  }
}

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
  },
  innerContainer: {
    height: '100%',
  },
  screenContainer: {
    height: '100%',
  },
  screenMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    opacity: 0.6,
  },
  menuDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 100,
  },
  topBarProtector: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50, // will be overwritten by insets
    backgroundColor: colors.white,
  },
  topBarProtectorDark: {
    backgroundColor: colors.black,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingLeft: 5,
    paddingRight: 25,
  },
  ctrl: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 5,
  },
  notificationCount: {
    position: 'absolute',
    left: '60%',
    top: 10,
    backgroundColor: colors.red3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 8,
  },
  notificationCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  tabCount: {
    position: 'absolute',
    left: 46,
    top: 30,
  },
  tabCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.black,
  },
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  inactive: {
    color: colors.gray3,
  },
  bumpUpOnePixel: {
    position: 'relative',
    top: -1,
  },
})

import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {
  Animated,
  GestureResponderEvent,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native'
import {ScreenContainer, Screen} from 'react-native-screens'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {useStores} from 'state/index'
import {
  NavigationModel,
  TabPurpose,
  TabPurposeMainPath,
} from 'state/models/navigation'
import {match, MatchResult} from '../../routes'
import {Login} from '../../screens/Login'
import {Menu} from './Menu'
import {HorzSwipe} from '../../com/util/gestures/HorzSwipe'
import {ModalsContainer} from '../../com/modals/Modal'
import {Lightbox} from '../../com/lightbox/Lightbox'
import {Text} from '../../com/util/text/Text'
import {ErrorBoundary} from '../../com/util/ErrorBoundary'
import {Composer} from './Composer'
import {s, colors} from 'lib/styles'
import {clamp} from 'lib/numbers'
import {
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  ComposeIcon2,
  BellIcon,
  BellIconSolid,
  UserIcon,
} from 'lib/icons'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics'

const Btn = ({
  icon,
  notificationCount,
  isCurrent,
  onPress,
  onLongPress,
}: {
  icon: JSX.Element
  notificationCount?: number
  isCurrent?: boolean
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}) => {
  return (
    <TouchableOpacity
      style={styles.ctrl}
      onPress={onLongPress ? onPress : undefined}
      onPressIn={onLongPress ? undefined : onPress}
      onLongPress={onLongPress}>
      {isCurrent ? <View style={styles.currentIndicator} /> : undefined}
      {notificationCount ? (
        <View style={styles.notificationCount}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : undefined}
      {icon}
    </TouchableOpacity>
  )
}

export const MobileShell: React.FC = observer(() => {
  const theme = useTheme()
  const pal = usePalette('default')
  const store = useStores()
  const winDim = useWindowDimensions()
  const [menuSwipingDirection, setMenuSwipingDirection] = useState(0)
  const swipeGestureInterp = useAnimatedValue(0)
  const minimalShellInterp = useAnimatedValue(0)
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
  const onPressCompose = () => {
    track('MobileShell:ComposeButtonPressed')
    store.shell.openComposer({})
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
  const onPressProfile = () => {
    track('MobileShell:ProfileButtonPressed')
    store.nav.navigate(`/profile/${store.me.handle}`)
  }

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

  if (store.hackUpgradeNeeded) {
    return (
      <View style={styles.outerContainer}>
        <View style={[s.flexCol, s.p20, s.h100pct]}>
          <View style={s.flex1} />
          <View>
            <Text type="title-2xl" style={s.pb10}>
              Update required
            </Text>
            <Text style={[s.pb20, s.bold]}>
              Please update your app to the latest version. If no update is
              available yet, please check the App Store in a day or so.
            </Text>
            <Text type="title" style={s.pb10}>
              What's happening?
            </Text>
            <Text style={s.pb10}>
              We're in the final stages of the AT Protocol's v1 development. To
              make sure everything works as well as possible, we're making final
              breaking changes to the APIs.
            </Text>
            <Text>
              If we didn't botch this process, a new version of the app should
              be available now.
            </Text>
          </View>
          <View style={s.flex1} />
          <View style={s.footerSpacer} />
        </View>
      </View>
    )
  }

  if (!store.session.hasSession) {
    return (
      <View style={styles.outerContainer}>
        <StatusBar
          barStyle={
            theme.colorScheme === 'dark' ? 'light-content' : 'dark-content'
          }
        />
        <Login />
        <ModalsContainer />
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
      <Animated.View
        style={[
          styles.bottomBar,
          pal.view,
          pal.border,
          {paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
          footerMinimalShellTransform,
        ]}>
        <Btn
          icon={
            isAtHome ? (
              <HomeIconSolid
                strokeWidth={3}
                size={28}
                style={[styles.ctrlIcon, pal.text]}
              />
            ) : (
              <HomeIcon
                strokeWidth={3}
                size={28}
                style={[styles.ctrlIcon, pal.text]}
              />
            )
          }
          isCurrent={isAtHome}
          onPress={onPressHome}
        />
        <Btn
          icon={
            isAtSearch ? (
              <MagnifyingGlassIcon2Solid
                size={28}
                style={[styles.ctrlIcon, pal.text, styles.bumpUpOnePixel]}
                strokeWidth={1.5}
              />
            ) : (
              <MagnifyingGlassIcon2
                size={28}
                style={[styles.ctrlIcon, pal.text, styles.bumpUpOnePixel]}
                strokeWidth={1.5}
              />
            )
          }
          isCurrent={isAtSearch}
          onPress={onPressSearch}
        />
        <TouchableOpacity style={styles.postCtrl} onPressIn={onPressCompose}>
          <ComposeIcon2
            strokeWidth={1.1}
            size={40}
            style={[styles.ctrlIcon, pal.text]}
            backgroundColor={pal.colors.background}
          />
        </TouchableOpacity>
        <Btn
          icon={
            isAtNotifications ? (
              <BellIconSolid
                size={27}
                strokeWidth={1.7}
                style={[styles.ctrlIcon, pal.text, styles.bumpUpOnePixel]}
              />
            ) : (
              <BellIcon
                size={27}
                strokeWidth={1.7}
                style={[styles.ctrlIcon, pal.text, styles.bumpUpOnePixel]}
              />
            )
          }
          isCurrent={isAtNotifications}
          onPress={onPressNotifications}
          notificationCount={store.me.notifications.unreadCount}
        />
        <Btn
          icon={
            <View style={styles.ctrlIconSizingWrapper}>
              <UserIcon
                size={32}
                strokeWidth={1.2}
                style={[styles.ctrlIcon, pal.text, styles.profileIcon]}
              />
            </View>
          }
          onPress={onPressProfile}
        />
      </Animated.View>
      <ModalsContainer />
      <Lightbox />
      <Composer
        active={store.shell.isComposerActive}
        onClose={() => store.shell.closeComposer()}
        winHeight={winDim.height}
        replyTo={store.shell.composerOpts?.replyTo}
        imagesOpen={store.shell.composerOpts?.imagesOpen}
        onPost={store.shell.composerOpts?.onPost}
        quote={store.shell.composerOpts?.quote}
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
    paddingRight: 10,
  },
  ctrl: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 2,
  },
  postCtrl: {
    flex: 1.2,
    paddingTop: 4,
  },
  currentIndicator: {
    position: 'absolute',
    backgroundColor: colors.blue3,
    left: '50%',
    transform: [{translateX: -4}],
    bottom: -4,
    width: 8,
    height: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  notificationCount: {
    position: 'absolute',
    left: '52%',
    top: 10,
    backgroundColor: colors.red3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 8,
    zIndex: 1,
  },
  notificationCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  ctrlIconSizingWrapper: {
    height: 27,
  },
  profileIcon: {
    top: -3,
  },
  inactive: {
    color: colors.gray3,
  },
  bumpUpOnePixel: {
    position: 'relative',
    top: -1,
  },
})

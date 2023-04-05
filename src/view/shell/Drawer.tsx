import React from 'react'
import {
  Linking,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {
  useNavigation,
  useNavigationState,
  StackActions,
} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {s, colors} from 'lib/styles'
import {FEEDBACK_FORM_URL} from 'lib/constants'
import {useStores} from 'state/index'
import {
  HomeIcon,
  HomeIconSolid,
  BellIcon,
  BellIconSolid,
  UserIcon,
  CogIcon,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  MoonIcon,
} from 'lib/icons'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Text} from 'view/com/util/text/Text'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics'
import {pluralize} from 'lib/strings/helpers'
import {getTabState, TabState} from 'lib/routes/helpers'
import {NavigationProp} from 'lib/routes/types'

export const DrawerContent = observer(() => {
  const theme = useTheme()
  const pal = usePalette('default')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()
  const {track} = useAnalytics()
  const {isAtHome, isAtSearch, isAtNotifications} = useNavigationState(
    state => {
      return {
        isAtHome: getTabState(state, 'Home') !== TabState.Outside,
        isAtSearch: getTabState(state, 'Search') !== TabState.Outside,
        isAtNotifications:
          getTabState(state, 'Notifications') !== TabState.Outside,
      }
    },
  )

  // events
  // =

  const onPressTab = React.useCallback(
    (tab: string) => {
      track('Menu:ItemClicked', {url: tab})
      const state = navigation.getState()
      store.shell.closeDrawer()
      const tabState = getTabState(state, tab)
      if (tabState === TabState.InsideAtRoot) {
        store.emitScreenSoftReset()
      } else if (tabState === TabState.Inside) {
        navigation.dispatch(StackActions.popToTop())
      } else {
        // @ts-ignore must be Home, Search, or Notifications
        navigation.navigate(`${tab}Tab`)
      }
    },
    [store, track, navigation],
  )

  const onPressHome = React.useCallback(() => onPressTab('Home'), [onPressTab])

  const onPressSearch = React.useCallback(
    () => onPressTab('Search'),
    [onPressTab],
  )

  const onPressNotifications = React.useCallback(
    () => onPressTab('Notifications'),
    [onPressTab],
  )

  const onPressProfile = React.useCallback(() => {
    track('Menu:ItemClicked', {url: 'Profile'})
    navigation.navigate('Profile', {name: store.me.handle})
    store.shell.closeDrawer()
  }, [navigation, track, store.me.handle, store.shell])

  const onPressSettings = React.useCallback(() => {
    track('Menu:ItemClicked', {url: 'Settings'})
    navigation.navigate('Settings')
    store.shell.closeDrawer()
  }, [navigation, track, store.shell])

  const onPressFeedback = React.useCallback(() => {
    track('Menu:FeedbackClicked')
    Linking.openURL(FEEDBACK_FORM_URL)
  }, [track])

  const onDarkmodePress = React.useCallback(() => {
    track('Menu:ItemClicked', {url: '#darkmode'})
    store.shell.setDarkMode(!store.shell.darkMode)
  }, [track, store])

  // rendering
  // =

  return (
    <View
      testID="drawer"
      style={[
        styles.view,
        theme.colorScheme === 'light' ? pal.view : styles.viewDarkMode,
      ]}>
      <SafeAreaView style={s.flex1}>
        <View style={styles.main}>
          <TouchableOpacity testID="profileCardButton" onPress={onPressProfile}>
            <UserAvatar size={80} avatar={store.me.avatar} />
            <Text
              type="title-lg"
              style={[pal.text, s.bold, styles.profileCardDisplayName]}>
              {store.me.displayName || store.me.handle}
            </Text>
            <Text type="2xl" style={[pal.textLight, styles.profileCardHandle]}>
              @{store.me.handle}
            </Text>
            <Text
              type="xl"
              style={[pal.textLight, styles.profileCardFollowers]}>
              <Text type="xl-medium" style={pal.text}>
                {store.me.followersCount || 0}
              </Text>{' '}
              {pluralize(store.me.followersCount || 0, 'follower')} &middot;{' '}
              <Text type="xl-medium" style={pal.text}>
                {store.me.followsCount || 0}
              </Text>{' '}
              following
            </Text>
          </TouchableOpacity>
        </View>
        <InviteCodes />
        <View style={s.flex1} />
        <View style={styles.main}>
          <MenuItem
            icon={
              isAtSearch ? (
                <MagnifyingGlassIcon2Solid
                  style={pal.text as StyleProp<ViewStyle>}
                  size={24}
                  strokeWidth={1.7}
                />
              ) : (
                <MagnifyingGlassIcon2
                  style={pal.text as StyleProp<ViewStyle>}
                  size={24}
                  strokeWidth={1.7}
                />
              )
            }
            label="Search"
            bold={isAtSearch}
            onPress={onPressSearch}
          />
          <MenuItem
            icon={
              isAtHome ? (
                <HomeIconSolid
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={3.25}
                />
              ) : (
                <HomeIcon
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={3.25}
                />
              )
            }
            label="Home"
            bold={isAtHome}
            onPress={onPressHome}
          />
          <MenuItem
            icon={
              isAtNotifications ? (
                <BellIconSolid
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={1.7}
                />
              ) : (
                <BellIcon
                  style={pal.text as StyleProp<ViewStyle>}
                  size="24"
                  strokeWidth={1.7}
                />
              )
            }
            label="Notifications"
            count={store.me.notifications.unreadCount}
            bold={isAtNotifications}
            onPress={onPressNotifications}
          />
          <MenuItem
            icon={
              <UserIcon
                style={pal.text as StyleProp<ViewStyle>}
                size="26"
                strokeWidth={1.5}
              />
            }
            label="Profile"
            onPress={onPressProfile}
          />
          <MenuItem
            icon={
              <CogIcon
                style={pal.text as StyleProp<ViewStyle>}
                size="26"
                strokeWidth={1.75}
              />
            }
            label="Settings"
            onPress={onPressSettings}
          />
        </View>
        <View style={s.flex1} />
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onDarkmodePress}
            style={[
              styles.footerBtn,
              theme.colorScheme === 'light'
                ? pal.btn
                : styles.footerBtnDarkMode,
            ]}>
            <MoonIcon
              size={22}
              style={pal.text as StyleProp<ViewStyle>}
              strokeWidth={2}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPressFeedback}
            style={[
              styles.footerBtn,
              styles.footerBtnFeedback,
              theme.colorScheme === 'light'
                ? styles.footerBtnFeedbackLight
                : styles.footerBtnFeedbackDark,
            ]}>
            <FontAwesomeIcon
              style={pal.link as FontAwesomeIconStyle}
              size={19}
              icon={['far', 'message']}
            />
            <Text type="2xl-medium" style={[pal.link, s.pl10]}>
              Feedback
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
})

function MenuItem({
  icon,
  label,
  count,
  bold,
  onPress,
}: {
  icon: JSX.Element
  label: string
  count?: number
  bold?: boolean
  onPress: () => void
}) {
  const pal = usePalette('default')
  return (
    <TouchableOpacity
      testID={`menuItemButton-${label}`}
      style={styles.menuItem}
      onPress={onPress}>
      <View style={[styles.menuItemIconWrapper]}>
        {icon}
        {count ? (
          <View
            style={[
              styles.menuItemCount,
              count > 99
                ? styles.menuItemCountHundreds
                : count > 9
                ? styles.menuItemCountTens
                : undefined,
            ]}>
            <Text style={styles.menuItemCountLabel} numberOfLines={1}>
              {count > 999 ? `${Math.round(count / 1000)}k` : count}
            </Text>
          </View>
        ) : undefined}
      </View>
      <Text
        type={bold ? '2xl-bold' : '2xl'}
        style={[pal.text, s.flex1]}
        numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function InviteCodes() {
  const {track} = useAnalytics()
  const store = useStores()
  const pal = usePalette('default')
  const numCodes = 5
  const onPress = React.useCallback(() => {
    track('Menu:ItemClicked', {url: '#invite-codes'})
    store.shell.closeDrawer()
    store.shell.openModal({name: 'invite-codes'})
  }, [store, track])
  return (
    <TouchableOpacity style={[styles.inviteCodes]} onPress={onPress}>
      <FontAwesomeIcon
        icon="ticket"
        style={[
          styles.inviteCodesIcon,
          numCodes > 0 ? pal.link : pal.textLight,
        ]}
        size={18}
      />
      <Text type="lg-medium" style={numCodes > 0 ? pal.link : pal.textLight}>
        {numCodes} invite {pluralize(numCodes, 'code')}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 50,
  },
  viewDarkMode: {
    backgroundColor: '#1B1919',
  },
  main: {
    paddingLeft: 20,
  },

  profileCardDisplayName: {
    marginTop: 20,
    paddingRight: 30,
  },
  profileCardHandle: {
    marginTop: 4,
    paddingRight: 30,
  },
  profileCardFollowers: {
    marginTop: 16,
    paddingRight: 10,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 10,
  },
  menuItemIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemCount: {
    position: 'absolute',
    width: 'auto',
    right: -6,
    top: -4,
    backgroundColor: colors.blue3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 6,
  },
  menuItemCountTens: {
    width: 25,
  },
  menuItemCountHundreds: {
    right: -12,
    width: 34,
  },
  menuItemCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    color: colors.white,
  },

  inviteCodes: {
    paddingLeft: 22,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteCodesIcon: {
    marginRight: 6,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 30,
    paddingTop: 20,
    paddingLeft: 20,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 25,
  },
  footerBtnDarkMode: {
    backgroundColor: colors.black,
  },
  footerBtnFeedback: {
    paddingHorizontal: 24,
  },
  footerBtnFeedbackLight: {
    backgroundColor: '#DDEFFF',
  },
  footerBtnFeedbackDark: {
    backgroundColor: colors.blue6,
  },
})

import * as React from 'react'
import {
  NavigationContainer,
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'

import {
  HomeTabNavigatorParams,
  SearchTabNavigatorParams,
  NotificationsTabNavigatorParams,
  AllNavigatorParams,
  State,
} from 'lib/routes/types'

import {Drawer} from './view/shell/Drawer'
import {BottomBar} from './view/shell/BottomBar'

import {HomeScreen} from './view/screens/Home'
import {SearchScreen} from './view/screens/Search'
import {NotificationsScreen} from './view/screens/Notifications'
import {NotFoundScreen} from './view/screens/NotFound'
import {SettingsScreen} from './view/screens/Settings'
import {ProfileScreen} from './view/screens/Profile'
import {ProfileFollowersScreen} from './view/screens/ProfileFollowers'
import {ProfileFollowsScreen} from './view/screens/ProfileFollows'
import {PostThreadScreen} from './view/screens/PostThread'
import {PostUpvotedByScreen} from './view/screens/PostUpvotedBy'
import {PostRepostedByScreen} from './view/screens/PostRepostedBy'
import {DebugScreen} from './view/screens/Debug'
import {LogScreen} from './view/screens/Log'

const navigationRef = createNavigationContainerRef<AllNavigatorParams>()

const HomeTab = createNativeStackNavigator<HomeTabNavigatorParams>()
const SearchTab = createNativeStackNavigator<SearchTabNavigatorParams>()
const NotificationsTab =
  createNativeStackNavigator<NotificationsTabNavigatorParams>()
const Tab = createBottomTabNavigator()

type RouteParams = Record<string, string>
type MatchResult = {params: RouteParams}
type Route = {
  match: (path: string) => MatchResult | undefined
  build: (params: RouteParams) => string
}
function r(pattern: string): Route {
  let matcherReInternal = pattern.replace(
    /:([\w]+)/g,
    (_m, name) => `(?<${name}>[^/]+)`,
  )
  const matcherRe = new RegExp(`^${matcherReInternal}([?]|$)`, 'i')
  return {
    match(path: string) {
      const res = matcherRe.exec(path)
      if (res) {
        return {params: res.groups || {}}
      }
      return undefined
    },
    build(params: Record<string, string>) {
      return pattern.replace(
        /:([\w]+)/g,
        (_m, name) => params[name] || 'undefined',
      )
    },
  }
}
const ROUTES: Record<string, Route> = {
  Home: r('/'),
  Search: r('/search'),
  Notifications: r('/notifications'),
  Settings: r('/settings'),
  Profile: r('/profile/:name'),
  ProfileFollowers: r('/profile/:name/followers'),
  ProfileFollows: r('/profile/:name/follows'),
  PostThread: r('/profile/:name/post/:rkey'),
  PostUpvotedBy: r('/profile/:name/post/:rkey/upvoted-by'),
  PostRepostedBy: r('/profile/:name/post/:rkey/reposted-by'),
  Debug: r('/sys/debug'),
  Log: r('/sys/log'),
}

function matchPath(path: string): {name: string; params: RouteParams} {
  let name = 'NotFound'
  let params: RouteParams = {}
  for (const [screenName, matcher] of Object.entries(ROUTES)) {
    const res = matcher.match(path)
    if (res) {
      name = screenName
      params = res.params
      break
    }
  }
  return {name, params}
}

const LINKING = {
  prefixes: ['bsky://', 'https://bsky.app'],

  getPathFromState(state: State) {
    // find the current node in the navigation tree
    let node = state.routes[state.index || 0]
    while (node.state?.routes && typeof node.state?.index === 'number') {
      node = node.state?.routes[node.state?.index]
    }

    // build the path
    const route = ROUTES[node.name]
    if (typeof route === 'undefined') {
      return '/' // default to home
    }
    return route.build((node.params || {}) as RouteParams)
  },

  getStateFromPath(path: string) {
    const {name, params} = matchPath(path)
    if (name === 'Search') {
      return buildStateObject('SearchTab', 'Search', params)
    }
    if (name === 'Notifications') {
      return buildStateObject('NotificationsTab', 'Notifications', params)
    }
    return buildStateObject('HomeTab', name, params)
  },
}

function buildStateObject(stack: string, route: string, params: RouteParams) {
  return {
    routes: [
      {
        name: stack,
        state: {
          routes: [{name: route, params}],
        },
      },
    ],
  }
}

function commonScreens(Stack: typeof HomeTab) {
  return (
    <>
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="ProfileFollowers"
        component={ProfileFollowersScreen}
      />
      <Stack.Screen name="ProfileFollows" component={ProfileFollowsScreen} />
      <Stack.Screen name="PostThread" component={PostThreadScreen} />
      <Stack.Screen name="PostUpvotedBy" component={PostUpvotedByScreen} />
      <Stack.Screen name="PostRepostedBy" component={PostRepostedByScreen} />
      <Stack.Screen name="Debug" component={DebugScreen} />
      <Stack.Screen name="Log" component={LogScreen} />
    </>
  )
}

function HomeTabNavigator() {
  return (
    <HomeTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
      }}>
      <HomeTab.Screen name="Home" component={HomeScreen} />
      {commonScreens(HomeTab)}
    </HomeTab.Navigator>
  )
}

function SearchTabNavigator() {
  return (
    <SearchTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
      }}>
      <SearchTab.Screen name="Search" component={SearchScreen} />
      {commonScreens(SearchTab as typeof HomeTab)}
    </SearchTab.Navigator>
  )
}

function NotificationsTabNavigator() {
  return (
    <NotificationsTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
      }}>
      <NotificationsTab.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
      {commonScreens(NotificationsTab as typeof HomeTab)}
    </NotificationsTab.Navigator>
  )
}

function TabsNavigator() {
  const tabBar = React.useCallback(props => <BottomBar {...props} />, [])
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      backBehavior="initialRoute"
      screenOptions={{headerShown: false}}
      tabBar={tabBar}>
      <Tab.Screen name="HomeTab" component={HomeTabNavigator} />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsTabNavigator}
      />
      <Tab.Screen name="SearchTab" component={SearchTabNavigator} />
    </Tab.Navigator>
  )
}

function RoutesContainer({children}: React.PropsWithChildren<{}>) {
  return (
    <NavigationContainer ref={navigationRef} linking={LINKING}>
      {children}
    </NavigationContainer>
  )
}

function navigate<K extends keyof AllNavigatorParams>(
  name: K,
  params?: AllNavigatorParams[K],
) {
  if (navigationRef.isReady()) {
    // @ts-ignore I dont know what would make typescript happy but I have a life -prf
    navigationRef.navigate(name, params)
  }
}

function resetToTab(tabName: 'HomeTab' | 'SearchTab' | 'NotificationsTab') {
  if (navigationRef.isReady()) {
    navigate(tabName)
    navigationRef.dispatch(StackActions.popToTop())
  }
}

export {navigate, resetToTab, matchPath, TabsNavigator, RoutesContainer}

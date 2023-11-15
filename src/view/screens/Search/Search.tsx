import React from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native'
import {AppBskyActorDefs, AppBskyFeedDefs, moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useFocusEffect} from '@react-navigation/native'

import {logger} from '#/logger'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from 'lib/routes/types'
import {CenteredView} from 'view/com/util/Views'
import {Text} from '#/view/com/util/text/Text'
import {NotificationFeedLoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {Post} from '#/view/com/post/Post'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {HITSLOP_10} from '#/lib/constants'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {usePalette} from '#/lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {useSession} from '#/state/session'
import {useMyFollowsQuery} from '#/state/queries/my-follows'
import {useGetSuggestedFollowersByActor} from '#/state/queries/suggested-follows'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {useSetDrawerOpen} from '#/state/shell'
import {useAnalytics} from '#/lib/analytics/analytics'
import {MagnifyingGlassIcon} from '#/lib/icons'
import {useModerationOpts} from '#/state/queries/preferences'
import {SearchResultCard} from '#/view/shell/desktop/Search'
import {useSetMinimalShellMode, useSetDrawerSwipeDisabled} from '#/state/shell'
import {useStores} from '#/state'

function Loader() {
  return (
    <View style={{padding: 18}}>
      <ActivityIndicator />
    </View>
  )
}

// TODO refactor how to translate?
function EmptyState({message, error}: {message: string; error?: string}) {
  const pal = usePalette('default')

  return (
    <View style={[pal.viewLight, {padding: 18, borderRadius: 8}]}>
      <Text style={[pal.text]}>
        <Trans>{message}</Trans>
      </Text>

      {error && (
        <>
          <View
            style={[
              {
                marginVertical: 12,
                height: 1,
                width: '100%',
                backgroundColor: pal.text.color,
                opacity: 0.2,
              },
            ]}
          />

          <Text style={[pal.textLight]}>
            <Trans>Error:</Trans> {error}
          </Text>
        </>
      )}
    </View>
  )
}

function SearchScreenSuggestedFollows() {
  const {currentAccount} = useSession()
  const [dataUpdatedAt, setDataUpdatedAt] = React.useState(0)
  const [suggestions, setSuggestions] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])
  const getSuggestedFollowsByActor = useGetSuggestedFollowersByActor()

  React.useEffect(() => {
    async function getSuggestions() {
      // TODO not quite right, doesn't fetch your follows
      const friends = await getSuggestedFollowsByActor(
        currentAccount!.did,
      ).then(friendsRes => friendsRes.suggestions)

      if (!friends) return // :(

      const friendsOfFriends = (
        await Promise.all(
          friends
            .slice(0, 4)
            .map(friend =>
              getSuggestedFollowsByActor(friend.did).then(
                foafsRes => foafsRes.suggestions,
              ),
            ),
        )
      ).flat()

      setSuggestions(
        // dedupe
        friendsOfFriends.filter(f => !friends.find(f2 => f.did === f2.did)),
      )
      setDataUpdatedAt(Date.now())
    }

    try {
      getSuggestions()
    } catch (e) {
      logger.error(`SearchScreenSuggestedFollows: failed to get suggestions`, {
        error: e,
      })
    }
  }, [
    currentAccount,
    setSuggestions,
    setDataUpdatedAt,
    getSuggestedFollowsByActor,
  ])

  return suggestions.length ? (
    <View style={styles.scrollContainer}>
      <FlatList
        data={suggestions}
        renderItem={({item}) => (
          <ProfileCardWithFollowBtn
            profile={item}
            noBg
            dataUpdatedAt={dataUpdatedAt}
          />
        )}
        keyExtractor={item => item.did}
        style={{flex: 1}}
      />
    </View>
  ) : (
    <NotificationFeedLoadingPlaceholder />
  )
}

type SearchResultSlice =
  | {
      type: 'post'
      key: string
      post: AppBskyFeedDefs.PostView
    }
  | {
      type: 'loadingMore'
      key: string
    }

function SearchScreenPostResults({query}: {query: string}) {
  const pal = usePalette('default')
  const [isPTR, setIsPTR] = React.useState(false)
  const {
    isFetched,
    data: results,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    dataUpdatedAt,
  } = useSearchPostsQuery({query})

  const onPullToRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [setIsPTR, refetch])
  const onEndReached = React.useCallback(() => {
    if (isFetching || !hasNextPage || error) return
    fetchNextPage()
  }, [isFetching, error, hasNextPage, fetchNextPage])

  const posts = React.useMemo(() => {
    return results?.pages.flatMap(page => page.posts) || []
  }, [results])
  const items = React.useMemo(() => {
    let items: SearchResultSlice[] = []

    for (const post of posts) {
      items.push({
        type: 'post',
        key: post.uri,
        post,
      })
    }

    if (isFetchingNextPage) {
      items.push({
        type: 'loadingMore',
        key: 'loadingMore',
      })
    }

    return items
  }, [posts, isFetchingNextPage])

  return error ? (
    <View style={{paddingHorizontal: 18}}>
      <EmptyState
        message="We're sorry, but your search could not be completed. Please try again in a few minutes."
        error={error.toString()}
      />
    </View>
  ) : (
    <>
      {isFetched ? (
        <>
          {posts.length ? (
            <FlatList
              data={items}
              renderItem={({item}) => {
                if (item.type === 'post') {
                  return <Post post={item.post} dataUpdatedAt={dataUpdatedAt} />
                } else {
                  return <Loader />
                }
              }}
              keyExtractor={item => item.key}
              style={{flex: 1}}
              refreshControl={
                <RefreshControl
                  refreshing={isPTR}
                  onRefresh={onPullToRefresh}
                  tintColor={pal.colors.text}
                  titleColor={pal.colors.text}
                />
              }
              onEndReached={onEndReached}
            />
          ) : (
            <View style={{padding: 18}}>
              <EmptyState message={`No results found for ${query}`} />
            </View>
          )}
        </>
      ) : (
        <Loader />
      )}
    </>
  )
}

function SearchScreenUserResults({query}: {query: string}) {
  const [isFetched, setIsFetched] = React.useState(false)
  const [dataUpdatedAt, setDataUpdatedAt] = React.useState(0)
  const [results, setResults] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])
  const search = useActorAutocompleteFn()
  // fuzzy search relies on followers
  const {isFetched: isFollowsFetched} = useMyFollowsQuery()

  React.useEffect(() => {
    async function getResults() {
      const results = await search({query, limit: 30})

      if (results) {
        setDataUpdatedAt(Date.now())
        setResults(results)
        setIsFetched(true)
      }
    }

    if (query && isFollowsFetched) {
      getResults()
    } else {
      setResults([])
      setIsFetched(false)
    }
  }, [query, isFollowsFetched, setDataUpdatedAt, search])

  return isFetched ? (
    <>
      {results.length ? (
        <FlatList
          data={results}
          renderItem={({item}) => (
            <ProfileCardWithFollowBtn
              profile={item}
              noBg
              dataUpdatedAt={dataUpdatedAt}
            />
          )}
          keyExtractor={item => item.did}
          style={{flex: 1}}
        />
      ) : (
        <View style={{padding: 18}}>
          <EmptyState message={`No results found for ${query}`} />
        </View>
      )}
    </>
  ) : (
    <Loader />
  )
}

export function SearchScreenInner({query}: {query?: string}) {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()

  const onPageSelected = React.useCallback(
    (index: number) => {
      setMinimalShellMode(false)
      setDrawerSwipeDisabled(index > 0)
    },
    [setDrawerSwipeDisabled, setMinimalShellMode],
  )

  return query ? (
    <View style={[styles.scrollContainer]}>
      <Pager
        onPageSelected={onPageSelected}
        renderTabBar={props => (
          <TabBar items={['Posts', 'Users']} {...props} />
        )}>
        <View>
          <SearchScreenPostResults query={query} />
        </View>
        <View>
          <SearchScreenUserResults query={query} />
        </View>
      </Pager>
    </View>
  ) : (
    <>
      <Text
        type="title"
        style={[
          pal.text,
          pal.border,
          {
            display: 'flex',
            paddingVertical: 12,
            paddingHorizontal: 18,
            fontWeight: 'bold',
          },
        ]}>
        <Trans>Suggested Follows</Trans>
      </Text>
      <SearchScreenSuggestedFollows />
    </>
  )
}

export function SearchScreenDesktop(
  props: NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>,
) {
  const pal = usePalette('default')
  const {isDesktop} = useWebMediaQueries()

  return (
    <CenteredView
      style={[
        pal.border,
        styles.scrollContainer,
        {borderLeftWidth: 1, borderRightWidth: 1},
      ]}>
      {isDesktop ? (
        <SearchScreenInner query={props.route.params?.q} />
      ) : (
        <SearchScreenMobile {...props} />
      )}
    </CenteredView>
  )
}

export function SearchScreenMobile(
  _props: NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>,
) {
  const theme = useTheme()
  const textInput = React.useRef<TextInput>(null)
  const {_} = useLingui()
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const setDrawerOpen = useSetDrawerOpen()
  const moderationOpts = useModerationOpts()
  const search = useActorAutocompleteFn()
  const setMinimalShellMode = useSetMinimalShellMode()
  const store = useStores()

  const searchDebounceTimeout = React.useRef<NodeJS.Timeout | undefined>(
    undefined,
  )
  const [isFetching, setIsFetching] = React.useState<boolean>(false)
  const [query, setQuery] = React.useState<string>('')
  const [searchResults, setSearchResults] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])
  const [inputIsFocused, setInputIsFocused] = React.useState(false)
  const [showAutocompleteResults, setShowAutocompleteResults] =
    React.useState(false)

  const onPressMenu = React.useCallback(() => {
    track('ViewHeader:MenuButtonClicked')
    setDrawerOpen(true)
  }, [track, setDrawerOpen])
  const onPressCancelSearch = React.useCallback(() => {
    textInput.current?.blur()
    setQuery('')
    setShowAutocompleteResults(false)
    if (searchDebounceTimeout.current)
      clearTimeout(searchDebounceTimeout.current)
  }, [textInput])
  const onPressClearQuery = React.useCallback(() => {
    setQuery('')
    setShowAutocompleteResults(false)
  }, [setQuery])
  const onChangeText = React.useCallback(
    async (text: string) => {
      setQuery(text)

      if (text.length > 0) {
        setIsFetching(true)
        setShowAutocompleteResults(true)

        if (searchDebounceTimeout.current)
          clearTimeout(searchDebounceTimeout.current)

        searchDebounceTimeout.current = setTimeout(async () => {
          const results = await search({query: text, limit: 30})

          if (results) {
            setSearchResults(results)
            setIsFetching(false)
          }
        }, 300)
      } else {
        if (searchDebounceTimeout.current)
          clearTimeout(searchDebounceTimeout.current)
        setSearchResults([])
        setIsFetching(false)
        setShowAutocompleteResults(false)
      }
    },
    [setQuery, search, setSearchResults],
  )
  const onSubmit = React.useCallback(() => {
    setShowAutocompleteResults(false)
  }, [setShowAutocompleteResults])

  const onSoftReset = React.useCallback(() => {
    onPressCancelSearch()
  }, [onPressCancelSearch])

  useFocusEffect(
    React.useCallback(() => {
      const softResetSub = store.onScreenSoftReset(onSoftReset)

      setMinimalShellMode(false)

      return () => {
        softResetSub.remove()
      }
    }, [store, onSoftReset, setMinimalShellMode]),
  )

  return (
    <View>
      <View style={[styles.header]}>
        <Pressable
          testID="viewHeaderBackOrMenuBtn"
          onPress={onPressMenu}
          hitSlop={HITSLOP_10}
          style={styles.headerMenuBtn}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Menu`)}
          accessibilityHint="Access navigation links and settings">
          <FontAwesomeIcon icon="bars" size={18} color={pal.colors.textLight} />
        </Pressable>

        <View
          style={[
            {backgroundColor: pal.colors.backgroundLight},
            styles.headerSearchContainer,
          ]}>
          <MagnifyingGlassIcon
            style={[pal.icon, styles.headerSearchIcon]}
            size={21}
          />
          <TextInput
            testID="searchTextInput"
            ref={textInput}
            placeholder="Search"
            placeholderTextColor={pal.colors.textLight}
            selectTextOnFocus
            returnKeyType="search"
            value={query}
            style={[pal.text, styles.headerSearchInput]}
            keyboardAppearance={theme.colorScheme}
            onFocus={() => setInputIsFocused(true)}
            onBlur={() => setInputIsFocused(false)}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            autoFocus={false}
            accessibilityRole="search"
            accessibilityLabel={_(msg`Search`)}
            accessibilityHint=""
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query ? (
            <Pressable
              testID="searchTextInputClearBtn"
              onPress={onPressClearQuery}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Clear search query`)}
              accessibilityHint="">
              <FontAwesomeIcon
                icon="xmark"
                size={16}
                style={pal.textLight as FontAwesomeIconStyle}
              />
            </Pressable>
          ) : undefined}
        </View>

        {query || inputIsFocused ? (
          <View style={styles.headerCancelBtn}>
            <Pressable onPress={onPressCancelSearch} accessibilityRole="button">
              <Text style={[pal.text]}>
                <Trans>Cancel</Trans>
              </Text>
            </Pressable>
          </View>
        ) : undefined}
      </View>

      {showAutocompleteResults && moderationOpts ? (
        <>
          {isFetching ? (
            <View style={{padding: 8}}>
              <ActivityIndicator />
            </View>
          ) : (
            <ScrollView style={{height: '100%'}}>
              {searchResults.length ? (
                searchResults.map((item, i) => (
                  <SearchResultCard
                    key={item.did}
                    profile={item}
                    moderation={moderateProfile(item, moderationOpts)}
                    style={i === 0 ? {borderTopWidth: 0} : {}}
                  />
                ))
              ) : (
                <View>
                  <Text style={[pal.textLight, styles.noResults]}>
                    <Trans>No results found for {query}</Trans>
                  </Text>
                </View>
              )}

              <View style={{height: 200}} />
            </ScrollView>
          )}
        </>
      ) : (
        <SearchScreenInner query={query} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    height: '100%',
    overflowY: 'auto',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerMenuBtn: {
    width: 30,
    height: 30,
    borderRadius: 30,
    marginRight: 6,
    paddingBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSearchIcon: {
    marginRight: 6,
    alignSelf: 'center',
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 17,
  },
  headerCancelBtn: {
    paddingLeft: 10,
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: 10,
  },
})

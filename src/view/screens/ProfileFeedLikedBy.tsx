import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostLikedBy as PostLikedByComponent} from '../com/post-thread/PostLikedBy'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {useShellState} from '#/state/shell'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFeedLikedBy'>
export const ProfileFeedLikedByScreen = withAuthRequired(({route}: Props) => {
  const {setMinimalShellMode} = useShellState()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.generator', rkey)

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View>
      <ViewHeader title="Liked by" />
      <PostLikedByComponent uri={uri} />
    </View>
  )
})

import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from './text/Text'
import {ago} from 'lib/strings/time'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {UserAvatar} from './UserAvatar'
import {observer} from 'mobx-react-lite'
import FollowButton from '../profile/FollowButton'

interface PostMetaOpts {
  authorAvatar?: string
  authorHandle: string
  authorDisplayName: string | undefined
  timestamp: string
  did?: string
  declarationCid?: string
  showFollowBtn?: boolean
}

export const PostMeta = observer(function (opts: PostMetaOpts) {
  const pal = usePalette('default')
  let displayName = opts.authorDisplayName || opts.authorHandle
  let handle = opts.authorHandle
  const store = useStores()
  const isMe = opts.did === store.me.did
  const isFollowing =
    typeof opts.did === 'string' && store.me.follows.isFollowing(opts.did)

  const [didFollow, setDidFollow] = React.useState(false)
  const onToggleFollow = React.useCallback(() => {
    setDidFollow(true)
  }, [setDidFollow])

  if (
    opts.showFollowBtn &&
    !isMe &&
    (!isFollowing || didFollow) &&
    opts.did &&
    opts.declarationCid
  ) {
    // two-liner with follow button
    return (
      <View style={[styles.metaTwoLine]}>
        <View>
          <Text
            type="lg-bold"
            style={[pal.text]}
            numberOfLines={1}
            lineHeight={1.2}>
            {displayName}{' '}
            <Text
              type="md"
              style={[styles.metaItem, pal.textLight]}
              lineHeight={1.2}>
              &middot; {ago(opts.timestamp)}
            </Text>
          </Text>
          <Text
            type="md"
            style={[styles.metaItem, pal.textLight]}
            lineHeight={1.2}>
            {handle ? (
              <Text type="md" style={[pal.textLight]}>
                @{handle}
              </Text>
            ) : undefined}
          </Text>
        </View>

        <View>
          <FollowButton
            did={opts.did}
            declarationCid={opts.declarationCid}
            onToggleFollow={onToggleFollow}
          />
        </View>
      </View>
    )
  }

  // one-liner
  return (
    <View style={styles.meta}>
      {typeof opts.authorAvatar !== 'undefined' && (
        <View style={[styles.metaItem, styles.avatar]}>
          <UserAvatar avatar={opts.authorAvatar} size={16} />
        </View>
      )}
      <View style={[styles.metaItem, styles.maxWidth]}>
        <Text
          type="lg-bold"
          style={[pal.text]}
          numberOfLines={1}
          lineHeight={1.2}>
          {displayName}
          {handle ? (
            <Text type="md" style={[pal.textLight]}>
              &nbsp;{handle}
            </Text>
          ) : undefined}
        </Text>
      </View>
      <Text type="md" style={[styles.metaItem, pal.textLight]} lineHeight={1.2}>
        &middot; {ago(opts.timestamp)}
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingBottom: 2,
  },
  metaTwoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  metaItem: {
    paddingRight: 5,
  },
  avatar: {
    alignSelf: 'center',
  },
  maxWidth: {
    maxWidth: '80%',
  },
})

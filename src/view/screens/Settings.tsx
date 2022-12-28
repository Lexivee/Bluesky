import React, {useEffect} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useStores} from '../../state'
import {ScreenParams} from '../routes'
import {s, colors} from '../lib/styles'
import {ViewHeader} from '../com/util/ViewHeader'
import {Link} from '../com/util/Link'
import {Text} from '../com/util/Text'
import {UserAvatar} from '../com/util/UserAvatar'

export const Settings = observer(function Settings({
  navIdx,
  visible,
}: ScreenParams) {
  const store = useStores()

  useEffect(() => {
    if (!visible) {
      return
    }
    store.shell.setMinimalShellMode(false)
    store.nav.setTitle(navIdx, 'Settings')
  }, [visible, store])

  const onPressSignout = () => {
    store.session.logout()
  }

  return (
    <View style={[s.flex1]}>
      <ViewHeader title="Settings" />
      <View style={[s.mt10, s.pl10, s.pr10]}>
        <View style={[s.flexRow]}>
          <Text style={s.black}>Signed in as</Text>
          <View style={s.flex1} />
          <TouchableOpacity onPress={onPressSignout}>
            <Text style={[s.blue3, s.bold]}>Sign out</Text>
          </TouchableOpacity>
        </View>
        <Link
          href={`/profile/${store.me.handle}`}
          title="Your profile"
          noFeedback>
          <View style={styles.profile}>
            <UserAvatar
              size={40}
              displayName={store.me.displayName}
              handle={store.me.handle || ''}
              avatar={store.me.avatar}
            />
            <View style={[s.ml10]}>
              <Text style={[s.f18, s.black]}>
                {store.me.displayName || store.me.handle}
              </Text>
              <Text style={[s.gray5]}>@{store.me.handle}</Text>
            </View>
          </View>
        </Link>
        <Link href="/debug" title="Debug tools">
          <Text style={s.blue3}>Debug tools</Text>
        </Link>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 14,
  },
  profile: {
    flexDirection: 'row',
    marginVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  avi: {
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 8,
  },
})

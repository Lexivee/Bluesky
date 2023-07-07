import React, {useState, useEffect, useCallback} from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useNavigation, StackActions} from '@react-navigation/native'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {ProfileModel} from 'state/models/content/profile'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {ProfileHeader} from '../profile/ProfileHeader'
import {Button} from '../util/forms/Button'
import {NavigationProp} from 'lib/routes/types'

export const snapPoints = [560]

export const Component = observer(({did}: {did: string}) => {
  const store = useStores()
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const navigation = useNavigation<NavigationProp>()
  const [model] = useState(new ProfileModel(store, {actor: did}))
  const {track} = useAnalytics()

  useEffect(() => {
    track('Profile:Preview')
    model.setup()
  }, [model, track])

  const onPressViewProfile = useCallback(() => {
    navigation.dispatch(StackActions.push('Profile', {name: model.handle}))
    store.shell.closeModal()
  }, [navigation, store, model])

  return (
    <View>
      <View style={styles.headerWrapper}>
        <ProfileHeader view={model} hideBackButton onRefreshAll={() => {}} />
      </View>
      <View style={[styles.buttons, pal.border, pal.view]}>
        <Button
          type="inverted"
          style={[styles.button, styles.buttonWide]}
          onPress={onPressViewProfile}
          accessibilityLabel="View profile"
          accessibilityHint="">
          <Text type="button-lg" style={palInverted.text}>
            View Profile
          </Text>
        </Button>
        <Button
          type="default"
          style={styles.button}
          onPress={() => store.shell.closeModal()}
          accessibilityLabel="Close this preview"
          accessibilityHint="">
          <Text type="button-lg" style={pal.text}>
            Close
          </Text>
        </Button>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  headerWrapper: {
    height: 450,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonWide: {
    flex: 3,
  },
})

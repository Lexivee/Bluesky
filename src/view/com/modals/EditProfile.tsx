import React, {useState} from 'react'
import * as Toast from '../util/Toast'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import RNFS, {CachesDirectoryPath} from 'react-native-fs'
import LinearGradient from 'react-native-linear-gradient'
import {BottomSheetScrollView, BottomSheetTextInput} from '@gorhom/bottom-sheet'
import {Image as PickedImage} from 'react-native-image-crop-picker'
import {Text} from '../util/text/Text'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {useStores} from '../../../state'
import {ProfileViewModel} from '../../../state/models/profile-view'
import {s, colors, gradients} from '../../lib/styles'
import {
  enforceLen,
  MAX_DISPLAY_NAME,
  MAX_DESCRIPTION,
} from '../../../lib/strings'
import {isNetworkError} from '../../../lib/errors'
import {compressIfNeeded, moveToPremanantPath} from '../../../lib/images'
import {UserBanner} from '../util/UserBanner'
import {UserAvatar} from '../util/UserAvatar'
import {usePalette} from '../../lib/hooks/usePalette'
import {useAnalytics} from '@segment/analytics-react-native'
import {cleanError} from '../../../lib/strings'

export const snapPoints = ['80%']

export function Component({
  profileView,
  onUpdate,
}: {
  profileView: ProfileViewModel
  onUpdate?: () => void
}) {
  const store = useStores()
  const [error, setError] = useState<string>('')
  const pal = usePalette('default')
  const {track} = useAnalytics()

  const [isProcessing, setProcessing] = useState<boolean>(false)
  const [displayName, setDisplayName] = useState<string>(
    profileView.displayName || '',
  )
  const [description, setDescription] = useState<string>(
    profileView.description || '',
  )
  const [userBanner, setUserBanner] = useState<string | undefined>(
    profileView.banner,
  )
  const [userAvatar, setUserAvatar] = useState<string | undefined>(
    profileView.avatar,
  )
  const [newUserBanner, setNewUserBanner] = useState<PickedImage | undefined>()
  const [newUserAvatar, setNewUserAvatar] = useState<PickedImage | undefined>()
  const onPressCancel = () => {
    store.shell.closeModal()
  }
  const onSelectNewAvatar = async (img: PickedImage) => {
    track('EditProfile:AvatarSelected')
    try {
      const finalImg = await compressIfNeeded(img, 1000000)

      setNewUserAvatar(finalImg)
      setUserAvatar(finalImg.path)
    } catch (e: any) {
      setError(cleanError(e))
    }
  }
  const onSelectNewBanner = async (img: PickedImage) => {
    track('EditProfile:BannerSelected')
    try {
      const finalImg = await compressIfNeeded(img, 1000000)
      setNewUserBanner(finalImg)
      setUserBanner(finalImg.path)
    } catch (e: any) {
      setError(cleanError(e))
    }
  }
  const onPressSave = async () => {
    track('EditProfile:Save')
    setProcessing(true)
    if (error) {
      setError('')
    }
    try {
      await profileView.updateProfile(
        {
          displayName,
          description,
        },
        newUserAvatar,
        newUserBanner,
      )
      Toast.show('Profile updated')
      onUpdate?.()
      store.shell.closeModal()
    } catch (e: any) {
      if (isNetworkError(e)) {
        setError(
          'Failed to save your profile. Check your internet connection and try again.',
        )
      } else {
        setError(cleanError(e))
      }
    }
    setProcessing(false)
  }

  return (
    <View style={s.flex1}>
      <BottomSheetScrollView style={[styles.inner, pal.view]}>
        <Text style={[styles.title, pal.text]}>Edit my profile</Text>
        <View style={styles.photos}>
          <UserBanner
            banner={userBanner}
            onSelectNewBanner={onSelectNewBanner}
            handle={profileView.handle}
          />
          <View style={[styles.avi, {borderColor: pal.colors.background}]}>
            <UserAvatar
              size={80}
              avatar={userAvatar}
              handle={profileView.handle}
              onSelectNewAvatar={onSelectNewAvatar}
              displayName={profileView.displayName}
            />
          </View>
        </View>
        {error !== '' && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={error} />
          </View>
        )}
        <View>
          <Text style={[styles.label, pal.text]}>Display Name</Text>
          <BottomSheetTextInput
            style={[styles.textInput, pal.text]}
            placeholder="e.g. Alice Roberts"
            placeholderTextColor={colors.gray4}
            value={displayName}
            onChangeText={v => setDisplayName(enforceLen(v, MAX_DISPLAY_NAME))}
          />
        </View>
        <View style={s.pb10}>
          <Text style={[styles.label, pal.text]}>Description</Text>
          <BottomSheetTextInput
            style={[styles.textArea, pal.text]}
            placeholder="e.g. Artist, dog-lover, and memelord."
            placeholderTextColor={colors.gray4}
            multiline
            value={description}
            onChangeText={v => setDescription(enforceLen(v, MAX_DESCRIPTION))}
          />
        </View>
        {isProcessing ? (
          <View style={[styles.btn, s.mt10, {backgroundColor: colors.gray2}]}>
            <ActivityIndicator />
          </View>
        ) : (
          <TouchableOpacity style={s.mt10} onPress={onPressSave}>
            <LinearGradient
              colors={[gradients.blueLight.start, gradients.blueLight.end]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.btn]}>
              <Text style={[s.white, s.bold]}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.mt5} onPress={onPressCancel}>
          <View style={[styles.btn]}>
            <Text style={[s.black, s.bold, pal.text]}>Cancel</Text>
          </View>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  inner: {
    padding: 14,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 18,
  },
  label: {
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingBottom: 4,
    marginTop: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.black,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 16,
    color: colors.black,
    height: 100,
    textAlignVertical: 'top',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 10,
    marginBottom: 10,
  },
  avi: {
    position: 'absolute',
    top: 80,
    left: 10,
    width: 84,
    height: 84,
    borderWidth: 2,
    borderRadius: 42,
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  photos: {
    marginBottom: 36,
    marginHorizontal: -14,
  },
  errorContainer: {marginTop: 20},
})

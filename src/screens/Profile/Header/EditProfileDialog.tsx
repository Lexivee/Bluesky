import React, {useCallback, useEffect, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {compressIfNeeded} from '#/lib/media/manip'
import {cleanError} from '#/lib/strings/errors'
import {useWarnMaxGraphemeCount} from '#/lib/strings/helpers'
import {logger} from '#/logger'
import {useProfileUpdateMutation} from '#/state/queries/profile'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import * as Toast from '#/view/com/util/Toast'
import {EditableUserAvatar} from '#/view/com/util/UserAvatar'
import {UserBanner} from '#/view/com/util/UserBanner'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {createPortalGroup} from '#/components/Portal'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'

const DISPLAY_NAME_MAX_GRAPHEMES = 64
const DESCRIPTION_MAX_GRAPHEMES = 256

const Portal = createPortalGroup()

export function EditProfileDialog({
  profile,
  control,
  onUpdate,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  control: Dialog.DialogControlProps
  onUpdate?: () => void
}) {
  const {_} = useLingui()
  const cancelControl = Dialog.useDialogControl()
  const [dirty, setDirty] = useState(false)
  const {height} = useWindowDimensions()

  const onPressCancel = useCallback(() => {
    if (dirty) {
      cancelControl.open()
    } else {
      control.close()
    }
  }, [dirty, control, cancelControl])

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{
        preventDismiss: dirty,
        minHeight: height,
      }}>
      <Portal.Provider>
        <DialogInner
          profile={profile}
          onUpdate={onUpdate}
          setDirty={setDirty}
          onPressCancel={onPressCancel}
        />

        <Prompt.Basic
          control={cancelControl}
          title={_(msg`Discard changes?`)}
          description={_(msg`Are you sure you want to discard your changes?`)}
          onConfirm={() => control.close()}
          confirmButtonCta={_(msg`Discard`)}
          confirmButtonColor="negative"
          Portal={Portal.Portal}
        />
        <Portal.Outlet />
      </Portal.Provider>
    </Dialog.Outer>
  )
}

function DialogInner({
  profile,
  onUpdate,
  setDirty,
  onPressCancel,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  onUpdate?: () => void
  setDirty: (dirty: boolean) => void
  onPressCancel: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()
  const {
    mutateAsync: updateProfileMutation,
    error: updateProfileError,
    isError: isUpdateProfileError,
    isPending: isUpdatingProfile,
  } = useProfileUpdateMutation()
  const [imageError, setImageError] = useState('')
  const initialDisplayName = profile.displayName || ''
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const initialDescription = profile.description || ''
  const [description, setDescription] = useState(initialDescription)
  const [userBanner, setUserBanner] = useState<string | undefined | null>(
    profile.banner,
  )
  const [userAvatar, setUserAvatar] = useState<string | undefined | null>(
    profile.avatar,
  )
  const [newUserBanner, setNewUserBanner] = useState<
    RNImage | undefined | null
  >()
  const [newUserAvatar, setNewUserAvatar] = useState<
    RNImage | undefined | null
  >()

  const dirty =
    displayName !== initialDisplayName ||
    description !== initialDescription ||
    userAvatar !== profile.avatar ||
    userBanner !== profile.banner

  useEffect(() => {
    setDirty(dirty)
  }, [dirty, setDirty])

  const onSelectNewAvatar = useCallback(
    async (img: RNImage | null) => {
      setImageError('')
      if (img === null) {
        setNewUserAvatar(null)
        setUserAvatar(null)
        return
      }
      try {
        const finalImg = await compressIfNeeded(img, 1000000)
        setNewUserAvatar(finalImg)
        setUserAvatar(finalImg.path)
      } catch (e: any) {
        setImageError(cleanError(e))
      }
    },
    [setNewUserAvatar, setUserAvatar, setImageError],
  )

  const onSelectNewBanner = useCallback(
    async (img: RNImage | null) => {
      setImageError('')
      if (!img) {
        setNewUserBanner(null)
        setUserBanner(null)
        return
      }
      try {
        const finalImg = await compressIfNeeded(img, 1000000)
        setNewUserBanner(finalImg)
        setUserBanner(finalImg.path)
      } catch (e: any) {
        setImageError(cleanError(e))
      }
    },
    [setNewUserBanner, setUserBanner, setImageError],
  )

  const onPressSave = useCallback(async () => {
    setImageError('')
    try {
      await updateProfileMutation({
        profile,
        updates: {
          displayName: displayName.trimEnd(),
          description: description.trimEnd(),
        },
        newUserAvatar,
        newUserBanner,
      })
      onUpdate?.()
      control.close()
      Toast.show(_(msg`Profile updated`))
    } catch (e: any) {
      logger.error('Failed to update user profile', {message: String(e)})
    }
  }, [
    updateProfileMutation,
    profile,
    onUpdate,
    control,
    displayName,
    description,
    newUserAvatar,
    newUserBanner,
    setImageError,
    _,
  ])

  const displayNameTooLong = useWarnMaxGraphemeCount({
    text: displayName,
    maxCount: DISPLAY_NAME_MAX_GRAPHEMES,
  })
  const descriptionTooLong = useWarnMaxGraphemeCount({
    text: description,
    maxCount: DESCRIPTION_MAX_GRAPHEMES,
  })

  const cancelButton = useCallback(
    () => (
      <Button
        label={_(msg`Cancel`)}
        onPress={onPressCancel}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}>
        <ButtonText style={[a.text_md]}>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
    ),
    [onPressCancel, _],
  )

  const saveButton = useCallback(
    () => (
      <Button
        label={_(msg`Save`)}
        onPress={onPressSave}
        disabled={
          !dirty ||
          isUpdatingProfile ||
          displayNameTooLong ||
          descriptionTooLong
        }
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}>
        <ButtonText style={[a.text_md, !dirty && t.atoms.text_contrast_low]}>
          <Trans>Save</Trans>
        </ButtonText>
      </Button>
    ),
    [
      _,
      t,
      dirty,
      onPressSave,
      isUpdatingProfile,
      displayNameTooLong,
      descriptionTooLong,
    ],
  )

  return (
    <Dialog.ScrollableInner
      label={_(msg`Edit profile`)}
      style={[a.overflow_hidden]}
      contentContainerStyle={[a.px_0, a.pt_0]}
      header={
        <DialogHeader renderLeft={cancelButton} renderRight={saveButton} />
      }>
      <View style={[a.relative]}>
        <UserBanner
          banner={userBanner}
          onSelectNewBanner={onSelectNewBanner}
          Portal={Portal.Portal}
        />
        <View
          style={[
            a.absolute,
            {
              top: 80,
              left: 20,
              width: 84,
              height: 84,
              borderWidth: 2,
              borderRadius: 42,
              borderColor: t.atoms.bg.backgroundColor,
            },
          ]}>
          <EditableUserAvatar
            size={80}
            avatar={userAvatar}
            onSelectNewAvatar={onSelectNewAvatar}
            Portal={Portal.Portal}
          />
        </View>
      </View>
      {isUpdateProfileError && (
        <View style={[a.mt_xl]}>
          <ErrorMessage message={cleanError(updateProfileError)} />
        </View>
      )}
      {imageError !== '' && (
        <View style={[a.mt_xl]}>
          <ErrorMessage message={imageError} />
        </View>
      )}
      <View style={[a.mt_4xl, a.px_xl, a.gap_xl]}>
        <View>
          <TextField.LabelText>
            <Trans>Display name</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={displayNameTooLong}>
            <Dialog.Input
              defaultValue={displayName}
              onChangeText={setDisplayName}
              label={_(msg`Display name`)}
              placeholder={_(msg`e.g. Alice Lastname`)}
            />
          </TextField.Root>
          {displayNameTooLong && (
            <TextField.SuffixText
              style={[
                a.text_sm,
                a.mt_xs,
                a.font_bold,
                {color: t.palette.negative_400},
              ]}
              label={_(msg`Display name is too long`)}>
              <Trans>
                Display name is too long. The maximum number of characters is{' '}
                {DISPLAY_NAME_MAX_GRAPHEMES}.
              </Trans>
            </TextField.SuffixText>
          )}
        </View>

        <View>
          <TextField.LabelText>
            <Trans>Description</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={descriptionTooLong}>
            <Dialog.Input
              defaultValue={description}
              onChangeText={setDescription}
              multiline
              label={_(msg`Display name`)}
              placeholder={_(msg`Tell us a bit about yourself`)}
            />
          </TextField.Root>
          {descriptionTooLong && (
            <TextField.SuffixText
              style={[
                a.text_sm,
                a.mt_xs,
                a.font_bold,
                {color: t.palette.negative_400},
              ]}
              label={_(msg`Description is too long`)}>
              <Trans>
                Description is too long. The maximum number of characters is{' '}
                {DESCRIPTION_MAX_GRAPHEMES}.
              </Trans>
            </TextField.SuffixText>
          )}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}

function DialogHeader({
  renderLeft,
  renderRight,
}: {
  renderLeft?: () => React.ReactNode
  renderRight?: () => React.ReactNode
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.relative,
        a.w_full,
        a.py_sm,
        a.flex_row,
        a.justify_center,
        a.align_center,
        {minHeight: 50},
        a.border_b,
        t.atoms.border_contrast_medium,
        t.atoms.bg,
      ]}>
      {renderLeft && (
        <View style={[a.absolute, {left: 6}]}>{renderLeft()}</View>
      )}
      <Text style={[a.text_lg, a.text_center, a.font_bold]}>
        <Trans>Edit profile</Trans>
      </Text>
      {renderRight && (
        <View style={[a.absolute, {right: 6}]}>{renderRight()}</View>
      )}
    </View>
  )
}

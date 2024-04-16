import React, {useCallback} from 'react'
import * as MediaLibrary from 'expo-media-library'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {POST_IMG_MAX} from '#/lib/constants'
import {useCameraPermission} from '#/lib/hooks/usePermissions'
import {openCamera} from '#/lib/media/picker'
import {logger} from '#/logger'
import {isMobileWeb, isNative} from '#/platform/detection'
import {GalleryModel} from '#/state/models/media/gallery'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'

type Props = {
  gallery: GalleryModel
}

export function OpenCameraBtn({gallery}: Props) {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const [mediaPermissionRes, requestMediaPermission] =
    MediaLibrary.usePermissions()

  const onPressTakePicture = useCallback(async () => {
    track('Composer:CameraOpened')
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }
      if (!mediaPermissionRes?.granted && mediaPermissionRes?.canAskAgain) {
        await requestMediaPermission()
      }

      const img = await openCamera({
        width: POST_IMG_MAX.width,
        height: POST_IMG_MAX.height,
        freeStyleCropEnabled: true,
      })

      // If we don't have permissions it's fine, we just wont save it. The post itself will still have access to
      // the image even without these permissions
      if (mediaPermissionRes) {
        await MediaLibrary.createAssetAsync(img.path)
      }
      gallery.add(img)
    } catch (err: any) {
      // ignore
      logger.warn('Error using camera', {error: err})
    }
  }, [
    gallery,
    track,
    requestCameraAccessIfNeeded,
    mediaPermissionRes,
    requestMediaPermission,
  ])

  const shouldShowCameraButton = isNative || isMobileWeb
  if (!shouldShowCameraButton) {
    return null
  }

  return (
    <Button
      testID="openCameraButton"
      onPress={onPressTakePicture}
      label={_(msg`Camera`)}
      accessibilityHint={_(msg`Opens camera on device`)}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary">
      <Camera size="lg" />
    </Button>
  )
}

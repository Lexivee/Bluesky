import {Alert} from 'react-native'
import {
  check,
  openSettings,
  Permission,
  PermissionStatus,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions'

export const PHOTO_LIBRARY = PERMISSIONS.IOS.PHOTO_LIBRARY
export const CAMERA = PERMISSIONS.IOS.CAMERA

/**
 * Returns `true` if the user has granted permission or hasn't made
 * a decision yet. Returns `false` if unavailable or not granted.
 */
export async function hasAccess(perm: Permission): Promise<boolean> {
  const status = await check(perm)
  return isntANo(status)
}

export async function requestAccessIfNeeded(
  perm: Permission,
): Promise<boolean> {
  const has = await hasAccess(perm)
  if (has) {
    return true
  }
  let desc
  if (perm === PHOTO_LIBRARY) {
    desc = 'photo library'
  } else if (perm === CAMERA) {
    desc = 'camera'
  } else {
    return false
  }
  Alert.alert(
    'Permission needed',
    `Bluesky does not have permission to access your ${desc}.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'Open Settings', onPress: () => openSettings()},
    ],
  )
  return false
}

export async function requestPhotoAccessIfNeeded() {
  return requestAccessIfNeeded(PHOTO_LIBRARY)
}

export async function requestCameraAccessIfNeeded() {
  return requestAccessIfNeeded(CAMERA)
}

function isntANo(status: PermissionStatus): boolean {
  return status !== RESULTS.UNAVAILABLE && status !== RESULTS.BLOCKED
}

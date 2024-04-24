import {Image as RNImage, Share as RNShare} from 'react-native'
import {Image} from 'react-native-image-crop-picker'
import uuid from 'react-native-uuid'
import {cacheDirectory, copyAsync, deleteAsync} from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import ImageResizer from '@bam.tech/react-native-image-resizer'
import RNFetchBlob from 'rn-fetch-blob'

import {isAndroid, isIOS} from 'platform/detection'
import {Dimensions} from './types'

export async function compressIfNeeded(
  img: Image,
  maxSize: number = 1000000,
): Promise<Image> {
  const origUri = `file://${img.path}`
  if (img.size < maxSize) {
    return img
  }
  const resizedImage = await doResize(origUri, {
    width: img.width,
    height: img.height,
    mode: 'stretch',
    maxSize,
  })
  const finalImageMovedPath = await moveToPermanentPath(
    resizedImage.path,
    '.jpg',
  )
  const finalImg = {
    ...resizedImage,
    path: finalImageMovedPath,
  }
  return finalImg
}

export interface DownloadAndResizeOpts {
  uri: string
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
  timeout: number
}

export async function downloadAndResize(opts: DownloadAndResizeOpts) {
  let appendExt = 'jpeg'
  try {
    const urip = new URL(opts.uri)
    const ext = urip.pathname.split('.').pop()
    if (ext === 'png') {
      appendExt = 'png'
    }
  } catch (e: any) {
    console.error('Invalid URI', opts.uri, e)
    return
  }

  let downloadRes
  try {
    const downloadResPromise = RNFetchBlob.config({
      fileCache: true,
      appendExt,
    }).fetch('GET', opts.uri)
    const to1 = setTimeout(() => downloadResPromise.cancel(), opts.timeout)
    downloadRes = await downloadResPromise
    clearTimeout(to1)

    const status = downloadRes.info().status
    if (status !== 200) {
      return
    }

    const localUri = normalizePath(downloadRes.path(), true)
    return await doResize(localUri, opts)
  } finally {
    // TODO Whenever we remove `rn-fetch-blob`, we will need to replace this `flush()` with a `deleteAsync()` -hailey
    if (downloadRes) {
      downloadRes.flush()
    }
  }
}

export async function shareImageModal({uri}: {uri: string}) {
  if (!(await Sharing.isAvailableAsync())) {
    // TODO might need to give an error to the user in this case -prf
    return
  }
  const downloadResponse = await RNFetchBlob.config({
    fileCache: true,
  }).fetch('GET', uri)

  // NOTE
  // assuming PNG
  // we're currently relying on the fact our CDN only serves pngs
  // -prf

  let imagePath = downloadResponse.path()
  imagePath = normalizePath(await moveToPermanentPath(imagePath, '.png'), true)

  // NOTE
  // for some reason expo-sharing refuses to work on iOS
  // ...and visa versa
  // -prf
  if (isIOS) {
    await RNShare.share({url: imagePath})
  } else {
    await Sharing.shareAsync(imagePath, {
      mimeType: 'image/png',
      UTI: 'image/png',
    })
  }

  safeDeleteAsync(imagePath)
}

export async function saveImageToMediaLibrary({uri}: {uri: string}) {
  // download the file to cache
  // NOTE
  // assuming PNG
  // we're currently relying on the fact our CDN only serves pngs
  // -prf
  const downloadResponse = await RNFetchBlob.config({
    fileCache: true,
  }).fetch('GET', uri)
  let imagePath = downloadResponse.path()
  imagePath = normalizePath(await moveToPermanentPath(imagePath, '.png'), true)

  // save
  await MediaLibrary.createAssetAsync(imagePath)
  safeDeleteAsync(imagePath)
}

export function getImageDim(path: string): Promise<Dimensions> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      path,
      (width, height) => {
        resolve({width, height})
      },
      reject,
    )
  })
}

// internal methods
// =

interface DoResizeOpts {
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
}

async function doResize(localUri: string, opts: DoResizeOpts): Promise<Image> {
  for (let i = 0; i < 9; i++) {
    const quality = 100 - i * 10
    const resizeRes = await ImageResizer.createResizedImage(
      localUri,
      opts.width,
      opts.height,
      'JPEG',
      quality,
      undefined,
      undefined,
      undefined,
      {mode: opts.mode},
    )
    if (resizeRes.size < opts.maxSize) {
      return {
        path: normalizePath(resizeRes.path),
        mime: 'image/jpeg',
        size: resizeRes.size,
        width: resizeRes.width,
        height: resizeRes.height,
      }
    } else {
      safeDeleteAsync(resizeRes.path)
    }
  }
  throw new Error(
    `This image is too big! We couldn't compress it down to ${opts.maxSize} bytes`,
  )
}

async function moveToPermanentPath(path: string, ext = 'jpg'): Promise<string> {
  /*
  Since this package stores images in a temp directory, we need to move the file to a permanent location.
  Relevant: IOS bug when trying to open a second time:
  https://github.com/ivpusic/react-native-image-crop-picker/issues/1199
  */
  const filename = uuid.v4()

  // cacheDirectory will not ever be null on native, but it could be on web. This function only ever gets called on
  // native so we assert as a string.
  const destinationPath = joinPath(cacheDirectory as string, filename + ext)
  await copyAsync({
    from: normalizePath(path),
    to: normalizePath(destinationPath),
  })
  safeDeleteAsync(path)
  return normalizePath(destinationPath)
}

async function safeDeleteAsync(path: string) {
  try {
    // Normalize is necessary for Android, otherwise it doesn't delete.
    await deleteAsync(normalizePath(path))
  } catch (e) {
    console.error('Failed to delete file', e)
  }
}

function joinPath(a: string, b: string) {
  if (a.endsWith('/')) {
    if (b.startsWith('/')) {
      return a.slice(0, -1) + b
    }
    return a + b
  } else if (b.startsWith('/')) {
    return a + b
  }
  return a + '/' + b
}

function normalizePath(str: string, allPlatforms = false): string {
  if (isAndroid || allPlatforms) {
    if (!str.startsWith('file://')) {
      return `file://${str}`
    }
  }
  return str
}

import {Dimensions} from './types'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {extractDataUriMime, getDataUriSize, isUriImage} from './util'

export interface DownloadAndResizeOpts {
  uri: string
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
  timeout: number
}

export async function downloadAndResize(opts: DownloadAndResizeOpts) {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), opts.timeout || 5e3)
  const res = await fetch(opts.uri)
  const resBody = await res.blob()
  clearTimeout(to)

  const dataUri = await blobToDataUri(resBody)
  return await resize(dataUri, opts)
}

export interface ResizeOpts {
  width: number
  height: number
  mode: 'contain' | 'cover' | 'stretch'
  maxSize: number
}

export async function resize(
  dataUri: string,
  _opts: ResizeOpts,
): Promise<RNImage> {
  const dim = await getImageDim(dataUri)
  // TODO -- need to resize
  return {
    path: dataUri,
    mime: extractDataUriMime(dataUri),
    size: getDataUriSize(dataUri),
    width: dim.width,
    height: dim.height,
  }
}

export async function resizeImage(image: RNImage): Promise<RNImage> {
  const uri = image.path
  const dim = await getImageDim(uri)
  // TODO -- need to resize
  return {
    path: uri,
    mime: extractDataUriMime(uri),
    size: getDataUriSize(uri),
    width: dim.width,
    height: dim.height,
  }
}

export async function moveToPermanentPath(path: string) {
  return path
}

// Still being used for EditProfile
export async function compressIfNeeded(
  img: RNImage,
  maxSize: number,
): Promise<RNImage> {
  if (img.size > maxSize) {
    // TODO
    throw new Error(
      "This image is too large and we haven't implemented compression yet -- sorry!",
    )
  }
  return img
}

export async function saveImageModal(_opts: {uri: string}) {
  // TODO
  throw new Error('TODO')
}

export async function getImageDim(path: string): Promise<Dimensions> {
  var img = document.createElement('img')
  const promise = new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })
  img.src = path
  await promise
  return {width: img.width, height: img.height}
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read blob'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function getImageFromUri(
  items: DataTransferItemList,
  callback: (uri: string) => void,
) {
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    const {kind, type} = item

    if (type === 'text/plain') {
      item.getAsString(async itemString => {
        if (isUriImage(itemString)) {
          const response = await fetch(itemString)
          const blob = await response.blob()
          const uri = URL.createObjectURL(blob)
          callback(uri)
        }
      })
    }

    if (kind === 'file') {
      const file = item.getAsFile()

      if (file instanceof Blob) {
        const uri = URL.createObjectURL(new Blob([file], {type: item.type}))
        callback(uri)
      }
    }
  }
}

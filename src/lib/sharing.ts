import {isIOS, isAndroid} from 'platform/detection'
// import * as Sharing from 'expo-sharing'
import {setStringAsync} from 'expo-clipboard'
import * as Toast from '../view/com/util/Toast'
import {Share} from 'react-native'

/**
 * This function shares a URL using the native Share API if available, or copies it to the clipboard
 * and displays a toast message if not (mostly on web)
 * @param {string} url - A string representing the URL that needs to be shared or copied to the
 * clipboard.
 */
export async function shareUrl(url: string) {
  if (isAndroid) {
    Share.share({message: url})
  } else if (isIOS) {
    Share.share({url})
  } else {
    // React Native Share is not supported by web. Web Share API
    // has increasing but not full support, so default to clipboard
    setStringAsync(url)
    Toast.show('Copied to clipboard')
  }
}

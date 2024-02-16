import React from 'react'
import {WebView, WebViewNavigation} from 'react-native-webview'
import {ShouldStartLoadRequest} from 'react-native-webview/lib/WebViewTypes'
import {StyleSheet} from 'react-native'

const ALLOWED_HOSTS = [
  '192.168.1.10:3000', // TODO these are some testing hosts we can remove
  '192.168.1.10:19006',
  'localhost:19006',
  'bsky.social',
  'bsky.app',
  'js.hcaptcha.com',
  'newassets.hcaptcha.com',
  'api2.hcaptcha.com',
]

const REDIRECT_HOST = 'localhost:19006'

export function CaptchaWebView({
  url,
  stateParam,
  onSuccess,
  onError,
}: {
  url: string
  stateParam: string
  onSuccess: (code: string) => void
  onError: () => void
}) {
  const wasSuccessful = React.useRef(false)

  const onShouldStartLoadWithRequest = React.useCallback(
    (event: ShouldStartLoadRequest) => {
      const urlp = new URL(event.url)
      return ALLOWED_HOSTS.includes(urlp.host)
    },
    [],
  )

  const onNavigationStateChange = React.useCallback(
    (e: WebViewNavigation) => {
      if (wasSuccessful.current) return

      const urlp = new URL(e.url)
      if (urlp.host !== REDIRECT_HOST) return

      const code = urlp.searchParams.get('code')
      if (urlp.searchParams.get('state') !== stateParam || !code) {
        onError()
        return
      }

      wasSuccessful.current = true
      onSuccess(code)
    },
    [stateParam, onSuccess, onError],
  )

  return (
    <WebView
      source={{uri: url}}
      javaScriptEnabled
      style={styles.webview}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      onNavigationStateChange={onNavigationStateChange}
    />
  )
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
})

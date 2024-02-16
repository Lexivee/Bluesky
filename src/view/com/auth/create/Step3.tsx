import React from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {
  CreateAccountState,
  CreateAccountDispatch,
  useSubmitCreateAccount,
} from './state'
import {StepHeader} from './StepHeader'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {isWeb} from 'platform/detection'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {nanoid} from 'nanoid/non-secure'
import {CaptchaWebView} from 'view/com/auth/create/CaptchaWebView'
import {useTheme} from 'lib/ThemeContext'

const CAPTCHA_URL = 'http://192.168.1.10:3000/gate'

export function Step3({
  uiState,
  uiDispatch,
}: {
  uiState: CreateAccountState
  uiDispatch: CreateAccountDispatch
}) {
  const {_} = useLingui()
  const theme = useTheme()
  const submit = useSubmitCreateAccount(uiState, uiDispatch)

  const [completed, setCompleted] = React.useState(false)

  const stateParam = React.useMemo(() => nanoid(15), [])
  const url = React.useMemo(() => {
    return `${CAPTCHA_URL}?email=${uiState.email}&state=${stateParam}&colorScheme=${theme.colorScheme}`
  }, [stateParam, uiState.email, theme.colorScheme])

  const onSuccess = React.useCallback(
    (code: string) => {
      setCompleted(true)
      submit(code)
    },
    [submit],
  )

  const onError = React.useCallback(() => {
    uiDispatch({
      type: 'set-error',
      value: _(msg`Error receiving captcha response.`),
    })
  }, [_, uiDispatch])

  return (
    <View>
      <StepHeader uiState={uiState} title={_(msg`Complete the challenge`)} />
      <View style={[styles.container, completed && styles.center]}>
        {!completed ? (
          <CaptchaWebView
            url={url}
            stateParam={stateParam}
            onSuccess={onSuccess}
            onError={onError}
          />
        ) : (
          <ActivityIndicator size="large" />
        )}
      </View>

      {uiState.error ? (
        <ErrorMessage message={uiState.error} style={styles.error} />
      ) : undefined}
    </View>
  )
}

const styles = StyleSheet.create({
  error: {
    borderRadius: 6,
    marginTop: 10,
  },
  // @ts-expect-error: Suppressing error due to incomplete `ViewStyle` type definition in react-native-web, missing `cursor` prop as discussed in https://github.com/necolas/react-native-web/issues/832.
  touchable: {
    ...(isWeb && {cursor: 'pointer'}),
  },
  container: {
    minHeight: 250,
    width: '100%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

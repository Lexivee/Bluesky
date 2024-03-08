import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import * as TextField from '#/components/forms/TextField'
import {useSignupContext} from '#/screens/Signup/state'
import {Text} from '#/components/Typography'
import {atoms as a, useTheme} from '#/alf'
import {
  createFullHandle,
  IsValidHandle,
  validateHandle,
} from 'lib/strings/handles'

export function StepHandle() {
  const {_} = useLingui()
  const t = useTheme()
  const {state, dispatch} = useSignupContext()

  const [validCheck, setValidCheck] = React.useState<IsValidHandle>({
    handleChars: false,
    frontLength: false,
    totalLength: true,
    overall: false,
  })

  useFocusEffect(
    React.useCallback(() => {
      setValidCheck(validateHandle(state.handle, state.userDomain))
      // Disabling this, because we only want to run this when we focus the screen
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  )

  const onHandleChange = React.useCallback(
    (value: string) => {
      if (state.error) {
        dispatch({type: 'setError', value: ''})
      }

      setValidCheck(validateHandle(value, state.userDomain))
      dispatch({
        type: 'setHandle',
        value,
      })
    },
    [dispatch, state.error, state.userDomain],
  )

  return (
    <View style={[a.gap_xl]}>
      <View>
        <TextField.Root>
          <TextField.Icon icon={At} />
          <TextField.Input
            onChangeText={onHandleChange}
            label={_(msg`Input your user handle`)}
            defaultValue={state.handle}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            autoComplete="off"
          />
        </TextField.Root>
      </View>
      <Text style={[a.text_md]}>
        <Trans>Your full handle will be</Trans>{' '}
        <Text style={[a.text_md, a.font_bold]}>
          @{createFullHandle(state.handle, state.userDomain)}
        </Text>
      </Text>

      <View
        style={[
          a.w_full,
          a.rounded_sm,
          a.border,
          a.p_md,
          a.gap_sm,
          t.atoms.border_contrast_low,
        ]}>
        {state.error ? (
          <View style={[a.w_full, a.flex_row, a.align_center, a.gap_sm]}>
            <IsValidIcon valid={false} />
            <Text style={[a.text_md, a.flex]}>{state.error}</Text>
          </View>
        ) : undefined}
        <View style={[a.w_full, a.flex_row, a.align_center, a.gap_sm]}>
          <IsValidIcon valid={validCheck.handleChars} />
          <Text style={[a.text_md, a.flex]}>
            <Trans>May only contain letters and numbers</Trans>
          </Text>
        </View>
        <View style={[a.w_full, a.flex_row, a.align_center, a.gap_sm]}>
          <IsValidIcon
            valid={validCheck.frontLength && validCheck.totalLength}
          />
          {!validCheck.totalLength ? (
            <Text style={[a.text_md]}>
              <Trans>May not be longer than 253 characters</Trans>
            </Text>
          ) : (
            <Text style={[a.text_md]}>
              <Trans>Must be at least 3 characters</Trans>
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

function IsValidIcon({valid}: {valid: boolean}) {
  const t = useTheme()
  if (!valid) {
    return <Times size="md" style={{color: t.palette.negative_500}} />
  }
  return <Check size="md" style={{color: t.palette.positive_700}} />
}

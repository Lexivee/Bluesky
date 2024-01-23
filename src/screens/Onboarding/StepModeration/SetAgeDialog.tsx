import {
  UsePreferencesQueryResponse,
  usePreferencesSetBirthDateMutation,
} from 'state/queries/preferences'
import {useTheme} from '#/alf'
import {useLingui} from '@lingui/react'
import React, {useState} from 'react'
import {logger} from '#/logger'
import * as Prompt from '#/components/Prompt'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {cleanError} from 'lib/strings/errors'
import {DateInput} from 'view/com/util/forms/DateInput'
import {msg} from '@lingui/macro'
import {ActivityIndicator, View} from 'react-native'

export function SetAgeDialog({
  preferences,
  prompt,
}: {
  preferences?: UsePreferencesQueryResponse
  prompt: any
}) {
  const t = useTheme()
  const {_} = useLingui()

  const {
    isPending,
    isError,
    error,
    mutateAsync: setBirthDate,
  } = usePreferencesSetBirthDateMutation()
  const [date, setDate] = useState(
    preferences?.birthDate ? new Date(preferences.birthDate) : new Date(),
  )
  const onSave = React.useCallback(async () => {
    try {
      await setBirthDate({birthDate: date})
      prompt.close()
    } catch (e) {
      logger.error(`setBirthDate failed`, {error: e})
    }
  }, [date, setBirthDate, prompt])

  return (
    <Prompt.Outer control={prompt}>
      <Prompt.Title>Set your age</Prompt.Title>
      <Prompt.Description>
        {isError ? <ErrorMessage message={cleanError(error)} /> : undefined}
        <DateInput
          handleAsUTC
          testID="birthdayInput"
          value={date}
          onChange={setDate}
          buttonLabelType="sm"
          accessibilityLabel={_(msg`Birthday`)}
          accessibilityHint={_(msg`Enter your birth date`)}
          accessibilityLabelledBy="birthDate"
        />
      </Prompt.Description>
      <Prompt.Actions>
        {isPending ? (
          <View>
            <ActivityIndicator color={t.palette.primary_500} />
          </View>
        ) : (
          <>
            <Prompt.Cancel onPress={prompt.close}>Cancel</Prompt.Cancel>
            <Prompt.Action onPress={onSave}>Confirm</Prompt.Action>
          </>
        )}
      </Prompt.Actions>
    </Prompt.Outer>
  )
}

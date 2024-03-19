import React, {useState, useEffect} from 'react'
import {ActivityIndicator, Keyboard, View} from 'react-native'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import * as EmailValidator from 'email-validator'
import {BskyAgent} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as TextField from '#/components/forms/TextField'
import {HostingProvider} from '#/components/forms/HostingProvider'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {atoms as a, useTheme} from '#/alf'
import {useAnalytics} from 'lib/analytics/analytics'
import {isNetworkError} from 'lib/strings/errors'
import {cleanError} from 'lib/strings/errors'
import {logger} from '#/logger'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {FormContainer} from './FormContainer'
import {FormError} from '#/components/forms/FormError'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const ForgotPasswordForm = ({
  error,
  serviceUrl,
  serviceDescription,
  setError,
  setServiceUrl,
  onPressBack,
  onEmailSent,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressBack: () => void
  onEmailSent: () => void
}) => {
  const t = useTheme()
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const {screen} = useAnalytics()
  const {_} = useLingui()

  useEffect(() => {
    screen('Signin:ForgotPassword')
  }, [screen])

  const onPressSelectService = React.useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const onPressNext = async () => {
    if (!EmailValidator.validate(email)) {
      return setError(_(msg`Your email appears to be invalid.`))
    }

    setError('')
    setIsProcessing(true)

    try {
      const agent = new BskyAgent({service: serviceUrl})
      await agent.com.atproto.server.requestPasswordReset({email})
      onEmailSent()
    } catch (e: any) {
      const errMsg = e.toString()
      logger.warn('Failed to request password reset', {error: e})
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          _(
            msg`Unable to contact your service. Please check your Internet connection.`,
          ),
        )
      } else {
        setError(cleanError(errMsg))
      }
    }
  }

  return (
    <FormContainer
      testID="forgotPasswordForm"
      title={<Trans>Reset password</Trans>}>
      <View>
        <TextField.Label>
          <Trans>Hosting provider</Trans>
        </TextField.Label>
        <HostingProvider
          serviceUrl={serviceUrl}
          onSelectServiceUrl={setServiceUrl}
          onOpenDialog={onPressSelectService}
        />
      </View>
      <View>
        <TextField.Label>
          <Trans>Email address</Trans>
        </TextField.Label>
        <TextField.Root>
          <TextField.Icon icon={At} />
          <TextField.Input
            testID="forgotPasswordEmail"
            label={_(msg`Enter your email address`)}
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!isProcessing}
            accessibilityHint={_(msg`Sets email for password reset`)}
          />
        </TextField.Root>
      </View>
      <View>
        <Text style={[t.atoms.text_contrast_high, a.mb_md]}>
          <Trans>
            Enter the email you used to create your account. We'll send you a
            "reset code" so you can set a new password.
          </Trans>
        </Text>
      </View>
      <FormError error={error} />
      <View style={[a.flex_row, a.align_center]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="small"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        {!serviceDescription || isProcessing ? (
          <ActivityIndicator />
        ) : (
          <Button
            label={_(msg`Next`)}
            variant="solid"
            color={email ? 'primary' : 'secondary'}
            size="small"
            onPress={onPressNext}
            disabled={!email}>
            <ButtonText>
              <Trans>Next</Trans>
            </ButtonText>
          </Button>
        )}
        {!serviceDescription || isProcessing ? (
          <Text style={[t.atoms.text_contrast_high, a.pl_md]}>
            <Trans>Processing...</Trans>
          </Text>
        ) : undefined}
      </View>
      <View
        style={[
          t.atoms.border_contrast_medium,
          a.border_t,
          a.pt_2xl,
          a.mt_md,
          a.flex_row,
          a.justify_center,
        ]}>
        <Button
          testID="skipSendEmailButton"
          onPress={onEmailSent}
          label={_(msg`Go to next`)}
          accessibilityHint={_(msg`Navigates to the next screen`)}
          size="small"
          variant="ghost"
          color="secondary">
          <ButtonText>
            <Trans>Already have a code?</Trans>
          </ButtonText>
        </Button>
      </View>
    </FormContainer>
  )
}

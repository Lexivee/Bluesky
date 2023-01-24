import React, {useState, useEffect} from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as EmailValidator from 'email-validator'
import {sessionClient as AtpApi, SessionServiceClient} from '@atproto/api'
import {LogoTextHero} from './Logo'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {s, colors} from '../../lib/styles'
import {createFullHandle, toNiceDomain} from '../../../lib/strings'
import {useStores, RootStoreModel, DEFAULT_SERVICE} from '../../../state'
import {ServiceDescription} from '../../../state/models/session'
import {ServerInputModal} from '../../../state/models/shell-ui'
import {AccountData} from '../../../state/models/session'
import {isNetworkError} from '../../../lib/errors'
import {usePalette} from '../../lib/hooks/usePalette'

enum Forms {
  Login,
  ChooseAccount,
  ForgotPassword,
  SetNewPassword,
  PasswordUpdated,
}

export const Signin = ({onPressBack}: {onPressBack: () => void}) => {
  const pal = usePalette('default')
  const store = useStores()
  const [error, setError] = useState<string>('')
  const [retryDescribeTrigger, setRetryDescribeTrigger] = useState<any>({})
  const [serviceUrl, setServiceUrl] = useState<string>(DEFAULT_SERVICE)
  const [serviceDescription, setServiceDescription] = useState<
    ServiceDescription | undefined
  >(undefined)
  const [initialHandle, setInitialHandle] = useState<string>('')
  const [currentForm, setCurrentForm] = useState<Forms>(
    store.session.hasAccounts ? Forms.ChooseAccount : Forms.Login,
  )

  const onSelectAccount = (account?: AccountData) => {
    if (account?.service) {
      setServiceUrl(account.service)
    }
    setInitialHandle(account?.handle || '')
    setCurrentForm(Forms.Login)
  }

  const gotoForm = (form: Forms) => () => {
    setError('')
    setCurrentForm(form)
  }

  useEffect(() => {
    let aborted = false
    setError('')
    store.session.describeService(serviceUrl).then(
      desc => {
        if (aborted) {
          return
        }
        setServiceDescription(desc)
      },
      err => {
        if (aborted) {
          return
        }
        store.log.warn(
          `Failed to fetch service description for ${serviceUrl}`,
          err,
        )
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      },
    )
    return () => {
      aborted = true
    }
  }, [store.session, store.log, serviceUrl, retryDescribeTrigger])

  const onPressRetryConnect = () => setRetryDescribeTrigger({})

  return (
    <KeyboardAvoidingView testID="signIn" behavior="padding" style={[pal.view]}>
      {currentForm === Forms.Login ? (
        <LoginForm
          store={store}
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          initialHandle={initialHandle}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressBack={onPressBack}
          onPressForgotPassword={gotoForm(Forms.ForgotPassword)}
          onPressRetryConnect={onPressRetryConnect}
        />
      ) : undefined}
      {currentForm === Forms.ChooseAccount ? (
        <ChooseAccountForm
          store={store}
          onSelectAccount={onSelectAccount}
          onPressBack={onPressBack}
        />
      ) : undefined}
      {currentForm === Forms.ForgotPassword ? (
        <ForgotPasswordForm
          store={store}
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          setError={setError}
          setServiceUrl={setServiceUrl}
          onPressBack={gotoForm(Forms.Login)}
          onEmailSent={gotoForm(Forms.SetNewPassword)}
        />
      ) : undefined}
      {currentForm === Forms.SetNewPassword ? (
        <SetNewPasswordForm
          store={store}
          error={error}
          serviceUrl={serviceUrl}
          setError={setError}
          onPressBack={gotoForm(Forms.ForgotPassword)}
          onPasswordSet={gotoForm(Forms.PasswordUpdated)}
        />
      ) : undefined}
      {currentForm === Forms.PasswordUpdated ? (
        <PasswordUpdatedForm onPressNext={gotoForm(Forms.Login)} />
      ) : undefined}
    </KeyboardAvoidingView>
  )
}

const ChooseAccountForm = ({
  store,
  onSelectAccount,
  onPressBack,
}: {
  store: RootStoreModel
  onSelectAccount: (account?: AccountData) => void
  onPressBack: () => void
}) => {
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = React.useState(false)

  const onTryAccount = async (account: AccountData) => {
    if (account.accessJwt && account.refreshJwt) {
      setIsProcessing(true)
      if (await store.session.resumeSession(account)) {
        setIsProcessing(false)
        return
      }
      setIsProcessing(false)
    }
    onSelectAccount(account)
  }

  return (
    <View testID="chooseAccountForm">
      <LogoTextHero />
      <Text type="sm-bold" style={[pal.text, styles.groupLabel]}>
        Sign in as...
      </Text>
      {store.session.accounts.map(account => (
        <TouchableOpacity
          testID={`chooseAccountBtn-${account.handle}`}
          key={account.did}
          style={[pal.borderDark, styles.group, s.mb5]}
          onPress={() => onTryAccount(account)}>
          <View
            style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
            <View style={s.p10}>
              <UserAvatar
                displayName={account.displayName}
                handle={account.handle}
                avatar={account.aviUrl}
                size={30}
              />
            </View>
            <Text style={styles.accountText}>
              <Text type="lg-bold" style={pal.text}>
                {account.displayName || account.handle}{' '}
              </Text>
              <Text type="lg" style={[pal.textLight]}>
                {account.handle}
              </Text>
            </Text>
            <FontAwesomeIcon
              icon="angle-right"
              size={16}
              style={[pal.text, s.mr10]}
            />
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        testID="chooseNewAccountBtn"
        style={[pal.borderDark, styles.group]}
        onPress={() => onSelectAccount(undefined)}>
        <View style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
          <Text style={[styles.accountText, styles.accountTextOther]}>
            <Text type="lg" style={pal.text}>
              Other account
            </Text>
          </Text>
          <FontAwesomeIcon
            icon="angle-right"
            size={16}
            style={[pal.text, s.mr10]}
          />
        </View>
      </TouchableOpacity>
      <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
        <TouchableOpacity onPress={onPressBack}>
          <Text type="xl" style={[pal.link, s.pl5]}>
            Back
          </Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        {isProcessing && <ActivityIndicator />}
      </View>
    </View>
  )
}

const LoginForm = ({
  store,
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressBack,
  onPressForgotPassword,
}: {
  store: RootStoreModel
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
}) => {
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [handle, setHandle] = useState<string>(initialHandle)
  const [password, setPassword] = useState<string>('')

  const onPressSelectService = () => {
    store.shell.openModal(new ServerInputModal(serviceUrl, setServiceUrl))
    Keyboard.dismiss()
  }

  const onPressNext = async () => {
    setError('')
    setIsProcessing(true)

    try {
      // try to guess the handle if the user just gave their own username
      let fullHandle = handle
      if (
        serviceDescription &&
        serviceDescription.availableUserDomains.length > 0
      ) {
        let matched = false
        for (const domain of serviceDescription.availableUserDomains) {
          if (fullHandle.endsWith(domain)) {
            matched = true
          }
        }
        if (!matched) {
          fullHandle = createFullHandle(
            handle,
            serviceDescription.availableUserDomains[0],
          )
        }
      }

      await store.session.login({
        service: serviceUrl,
        handle: fullHandle,
        password,
      })
    } catch (e: any) {
      const errMsg = e.toString()
      store.log.warn('Failed to login', e)
      setIsProcessing(false)
      if (errMsg.includes('Authentication Required')) {
        setError('Invalid username or password')
      } else if (isNetworkError(e)) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(errMsg.replace(/^Error:/, ''))
      }
    }
  }

  const isReady = !!serviceDescription && !!handle && !!password
  return (
    <View testID="loginForm">
      <LogoTextHero />
      <Text type="sm-bold" style={[pal.text, styles.groupLabel]}>
        Sign into
      </Text>
      <View style={[pal.borderDark, styles.group]}>
        <View style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
          <FontAwesomeIcon
            icon="globe"
            style={[pal.textLight, styles.groupContentIcon]}
          />
          <TouchableOpacity
            testID="loginSelectServiceButton"
            style={styles.textBtn}
            onPress={onPressSelectService}>
            <Text type="xl" style={[pal.text, styles.textBtnLabel]}>
              {toNiceDomain(serviceUrl)}
            </Text>
            <View style={[pal.btn, styles.textBtnFakeInnerBtn]}>
              <FontAwesomeIcon icon="pen" size={12} style={pal.textLight} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <Text type="sm-bold" style={[pal.text, styles.groupLabel]}>
        Account
      </Text>
      <View style={[pal.borderDark, styles.group]}>
        <View style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
          <FontAwesomeIcon
            icon="at"
            style={[pal.textLight, styles.groupContentIcon]}
          />
          <TextInput
            testID="loginUsernameInput"
            style={[pal.text, styles.textInput]}
            placeholder="Username"
            placeholderTextColor={pal.colors.textLight}
            autoCapitalize="none"
            autoFocus
            autoCorrect={false}
            value={handle}
            onChangeText={str => setHandle((str || '').toLowerCase())}
            editable={!isProcessing}
          />
        </View>
        <View style={[pal.borderDark, styles.groupContent]}>
          <FontAwesomeIcon
            icon="lock"
            style={[pal.textLight, styles.groupContentIcon]}
          />
          <TextInput
            testID="loginPasswordInput"
            style={[pal.text, styles.textInput]}
            placeholder="Password"
            placeholderTextColor={pal.colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isProcessing}
          />
          <TouchableOpacity
            testID="forgotPasswordButton"
            style={styles.textInputInnerBtn}
            onPress={onPressForgotPassword}>
            <Text style={pal.link}>Forgot</Text>
          </TouchableOpacity>
        </View>
      </View>
      {error ? (
        <View style={styles.error}>
          <View style={styles.errorIcon}>
            <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
          </View>
          <View style={s.flex1}>
            <Text style={[s.white, s.bold]}>{error}</Text>
          </View>
        </View>
      ) : undefined}
      <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
        <TouchableOpacity onPress={onPressBack}>
          <Text type="xl" style={[pal.link, s.pl5]}>
            Back
          </Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        {!serviceDescription && error ? (
          <TouchableOpacity
            testID="loginRetryButton"
            onPress={onPressRetryConnect}>
            <Text type="xl-bold" style={[pal.link, s.pr5]}>
              Retry
            </Text>
          </TouchableOpacity>
        ) : !serviceDescription ? (
          <>
            <ActivityIndicator />
            <Text type="xl" style={[pal.textLight, s.pl10]}>
              Connecting...
            </Text>
          </>
        ) : isProcessing ? (
          <ActivityIndicator />
        ) : isReady ? (
          <TouchableOpacity testID="loginNextButton" onPress={onPressNext}>
            <Text type="xl-bold" style={[pal.link, s.pr5]}>
              Next
            </Text>
          </TouchableOpacity>
        ) : undefined}
      </View>
    </View>
  )
}

const ForgotPasswordForm = ({
  store,
  error,
  serviceUrl,
  serviceDescription,
  setError,
  setServiceUrl,
  onPressBack,
  onEmailSent,
}: {
  store: RootStoreModel
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressBack: () => void
  onEmailSent: () => void
}) => {
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')

  const onPressSelectService = () => {
    store.shell.openModal(new ServerInputModal(serviceUrl, setServiceUrl))
  }

  const onPressNext = async () => {
    if (!EmailValidator.validate(email)) {
      return setError('Your email appears to be invalid.')
    }

    setError('')
    setIsProcessing(true)

    try {
      const api = AtpApi.service(serviceUrl) as SessionServiceClient
      await api.com.atproto.account.requestPasswordReset({email})
      onEmailSent()
    } catch (e: any) {
      const errMsg = e.toString()
      store.log.warn('Failed to request password reset', e)
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(errMsg.replace(/^Error:/, ''))
      }
    }
  }

  return (
    <>
      <LogoTextHero />
      <View>
        <Text type="title-lg" style={[pal.text, styles.screenTitle]}>
          Reset password
        </Text>
        <Text type="md" style={[pal.text, styles.instructions]}>
          Enter the email you used to create your account. We'll send you a
          "reset code" so you can set a new password.
        </Text>
        <View
          testID="forgotPasswordView"
          style={[pal.borderDark, pal.view, styles.group]}>
          <TouchableOpacity
            testID="forgotPasswordSelectServiceButton"
            style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}
            onPress={onPressSelectService}>
            <FontAwesomeIcon
              icon="globe"
              style={[pal.textLight, styles.groupContentIcon]}
            />
            <Text style={[pal.text, styles.textInput]} numberOfLines={1}>
              {toNiceDomain(serviceUrl)}
            </Text>
            <View style={[pal.btn, styles.textBtnFakeInnerBtn]}>
              <FontAwesomeIcon icon="pen" size={12} style={pal.text} />
            </View>
          </TouchableOpacity>
          <View style={[pal.borderDark, styles.groupContent]}>
            <FontAwesomeIcon
              icon="envelope"
              style={[pal.textLight, styles.groupContentIcon]}
            />
            <TextInput
              testID="forgotPasswordEmail"
              style={[pal.text, styles.textInput]}
              placeholder="Email address"
              placeholderTextColor={pal.colors.textLight}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!isProcessing}
            />
          </View>
        </View>
        {error ? (
          <View style={styles.error}>
            <View style={styles.errorIcon}>
              <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
            </View>
            <View style={s.flex1}>
              <Text style={[s.white, s.bold]}>{error}</Text>
            </View>
          </View>
        ) : undefined}
        <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
          <TouchableOpacity onPress={onPressBack}>
            <Text type="xl" style={[pal.link, s.pl5]}>
              Back
            </Text>
          </TouchableOpacity>
          <View style={s.flex1} />
          {!serviceDescription || isProcessing ? (
            <ActivityIndicator />
          ) : !email ? (
            <Text type="xl-bold" style={[pal.link, s.pr5, styles.dimmed]}>
              Next
            </Text>
          ) : (
            <TouchableOpacity testID="newPasswordButton" onPress={onPressNext}>
              <Text type="xl-bold" style={[pal.link, s.pr5]}>
                Next
              </Text>
            </TouchableOpacity>
          )}
          {!serviceDescription || isProcessing ? (
            <Text type="xl" style={[pal.textLight, s.pl10]}>
              Processing...
            </Text>
          ) : undefined}
        </View>
      </View>
    </>
  )
}

const SetNewPasswordForm = ({
  store,
  error,
  serviceUrl,
  setError,
  onPressBack,
  onPasswordSet,
}: {
  store: RootStoreModel
  error: string
  serviceUrl: string
  setError: (v: string) => void
  onPressBack: () => void
  onPasswordSet: () => void
}) => {
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [resetCode, setResetCode] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const onPressNext = async () => {
    setError('')
    setIsProcessing(true)

    try {
      const api = AtpApi.service(serviceUrl) as SessionServiceClient
      await api.com.atproto.account.resetPassword({token: resetCode, password})
      onPasswordSet()
    } catch (e: any) {
      const errMsg = e.toString()
      store.log.warn('Failed to set new password', e)
      setIsProcessing(false)
      if (isNetworkError(e)) {
        setError(
          'Unable to contact your service. Please check your Internet connection.',
        )
      } else {
        setError(errMsg.replace(/^Error:/, ''))
      }
    }
  }

  return (
    <>
      <LogoTextHero />
      <View>
        <Text type="title-lg" style={[pal.text, styles.screenTitle]}>
          Set new password
        </Text>
        <Text type="lg" style={[pal.text, styles.instructions]}>
          You will receive an email with a "reset code." Enter that code here,
          then enter your new password.
        </Text>
        <View
          testID="newPasswordView"
          style={[pal.view, pal.borderDark, styles.group]}>
          <View
            style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
            <FontAwesomeIcon
              icon="ticket"
              style={[pal.textLight, styles.groupContentIcon]}
            />
            <TextInput
              testID="resetCodeInput"
              style={[pal.text, styles.textInput]}
              placeholder="Reset code"
              placeholderTextColor={pal.colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              value={resetCode}
              onChangeText={setResetCode}
              editable={!isProcessing}
            />
          </View>
          <View style={[pal.borderDark, styles.groupContent]}>
            <FontAwesomeIcon
              icon="lock"
              style={[pal.textLight, styles.groupContentIcon]}
            />
            <TextInput
              testID="newPasswordInput"
              style={[pal.text, styles.textInput]}
              placeholder="New password"
              placeholderTextColor={pal.colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isProcessing}
            />
          </View>
        </View>
        {error ? (
          <View style={styles.error}>
            <View style={styles.errorIcon}>
              <FontAwesomeIcon icon="exclamation" style={s.white} size={10} />
            </View>
            <View style={s.flex1}>
              <Text style={[s.white, s.bold]}>{error}</Text>
            </View>
          </View>
        ) : undefined}
        <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
          <TouchableOpacity onPress={onPressBack}>
            <Text type="xl" style={[pal.link, s.pl5]}>
              Back
            </Text>
          </TouchableOpacity>
          <View style={s.flex1} />
          {isProcessing ? (
            <ActivityIndicator />
          ) : !resetCode || !password ? (
            <Text type="xl-bold" style={[pal.link, s.pr5, styles.dimmed]}>
              Next
            </Text>
          ) : (
            <TouchableOpacity
              testID="setNewPasswordButton"
              onPress={onPressNext}>
              <Text type="xl-bold" style={[pal.link, s.pr5]}>
                Next
              </Text>
            </TouchableOpacity>
          )}
          {isProcessing ? (
            <Text type="xl" style={[pal.textLight, s.pl10]}>
              Updating...
            </Text>
          ) : undefined}
        </View>
      </View>
    </>
  )
}

const PasswordUpdatedForm = ({onPressNext}: {onPressNext: () => void}) => {
  const pal = usePalette('default')
  return (
    <>
      <LogoTextHero />
      <View>
        <Text type="title-lg" style={[pal.text, styles.screenTitle]}>
          Password updated!
        </Text>
        <Text type="lg" style={[pal.text, styles.instructions]}>
          You can now sign in with your new password.
        </Text>
        <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
          <View style={s.flex1} />
          <TouchableOpacity onPress={onPressNext}>
            <Text type="xl-bold" style={[pal.link, s.pr5]}>
              Okay
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  screenTitle: {
    marginBottom: 10,
    marginHorizontal: 20,
  },
  instructions: {
    marginBottom: 20,
    marginHorizontal: 20,
  },
  group: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  groupLabel: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  groupContent: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noTopBorder: {
    borderTopWidth: 0,
  },
  groupContentIcon: {
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    letterSpacing: 0.25,
    fontWeight: '400',
    borderRadius: 10,
  },
  textInputInnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 6,
  },
  textBtn: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  textBtnLabel: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  textBtnFakeInnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 6,
  },
  accountText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 10,
  },
  accountTextOther: {
    paddingLeft: 12,
  },
  error: {
    backgroundColor: colors.red4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  errorIcon: {
    borderWidth: 1,
    borderColor: colors.white,
    color: colors.white,
    borderRadius: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  dimmed: {opacity: 0.5},
})

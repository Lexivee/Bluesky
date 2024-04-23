import React from 'react'
import {
  AtpPersistSessionHandler,
  BSKY_LABELER_DID,
  BskyAgent,
  SessionDispatcher,
} from '@atproto/api'
import {jwtDecode} from 'jwt-decode'

import {track} from '#/lib/analytics/analytics'
import {networkRetry} from '#/lib/async/retry'
import {IS_TEST_USER} from '#/lib/constants'
import {logEvent, LogEvents, tryFetchGates} from '#/lib/statsig/statsig'
import {hasProp} from '#/lib/type-guards'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {PUBLIC_BSKY_AGENT} from '#/state/queries'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {IS_DEV} from '#/env'
import {emitSessionDropped} from '../events'
import {readLabelers} from './agent-config'

let __globalAgent: BskyAgent = PUBLIC_BSKY_AGENT

function __getAgent() {
  return __globalAgent
}

export function useAgent() {
  return React.useMemo(() => ({getAgent: __getAgent}), [])
}

export type SessionAccount = persisted.PersistedAccount

export type SessionState = {
  isInitialLoad: boolean
  isSwitchingAccounts: boolean
  accounts: SessionAccount[]
  currentAccount: SessionAccount | undefined
}
export type StateContext = SessionState & {
  hasSession: boolean
}
export type ApiContext = {
  createAccount: (props: {
    service: string
    email: string
    password: string
    handle: string
    inviteCode?: string
    verificationPhone?: string
    verificationCode?: string
  }) => Promise<void>
  login: (
    props: {
      service: string
      identifier: string
      password: string
      authFactorToken?: string | undefined
    },
    logContext: LogEvents['account:loggedIn']['logContext'],
  ) => Promise<void>
  /**
   * A full logout. Clears the `currentAccount` from session, AND removes
   * access tokens from all accounts, so that returning as any user will
   * require a full login.
   */
  logout: (
    logContext: LogEvents['account:loggedOut']['logContext'],
  ) => Promise<void>
  /**
   * A partial logout. Clears the `currentAccount` from session, but DOES NOT
   * clear access tokens from accounts, allowing the user to return to their
   * other accounts without logging in.
   *
   * Used when adding a new account, deleting an account.
   */
  clearCurrentAccount: () => void
  initSession: (account: SessionAccount) => Promise<void>
  resumeSession: (account?: SessionAccount) => Promise<void>
  removeAccount: (account: SessionAccount) => void
  selectAccount: (
    account: SessionAccount,
    logContext: LogEvents['account:loggedIn']['logContext'],
  ) => Promise<void>
  updateCurrentAccount: (
    account: Partial<
      Pick<
        SessionAccount,
        'handle' | 'email' | 'emailConfirmed' | 'emailAuthFactor'
      >
    >,
  ) => void
}

const StateContext = React.createContext<StateContext>({
  isInitialLoad: true,
  isSwitchingAccounts: false,
  accounts: [],
  currentAccount: undefined,
  hasSession: false,
})

const ApiContext = React.createContext<ApiContext>({
  createAccount: async () => {},
  login: async () => {},
  logout: async () => {},
  initSession: async () => {},
  resumeSession: async () => {},
  removeAccount: () => {},
  selectAccount: async () => {},
  updateCurrentAccount: () => {},
  clearCurrentAccount: () => {},
})

function createPersistSessionHandler(
  dispatcher: SessionDispatcher,
  account: SessionAccount,
  persistSessionCallback: (props: {
    expired: boolean
    refreshedAccount: SessionAccount
  }) => void,
  {
    networkErrorCallback,
  }: {
    networkErrorCallback?: () => void
  } = {},
): AtpPersistSessionHandler {
  return function persistSession(event, session) {
    const expired = event === 'expired' || event === 'create-failed'

    if (event === 'network-error') {
      logger.warn(`session: persistSessionHandler received network-error event`)
      networkErrorCallback?.()
      return
    }

    const refreshedAccount: SessionAccount = {
      service: account.service,
      did: session?.did || account.did,
      handle: session?.handle || account.handle,
      email: session?.email || account.email,
      emailConfirmed: session?.emailConfirmed || account.emailConfirmed,
      deactivated: isSessionDeactivated(session?.accessJwt),
      pdsUrl: dispatcher.pdsUrl?.toString(),

      /*
       * Tokens are undefined if the session expires, or if creation fails for
       * any reason e.g. tokens are invalid, network error, etc.
       */
      refreshJwt: session?.refreshJwt,
      accessJwt: session?.accessJwt,
    }

    logger.debug(`session: persistSession`, {
      event,
      deactivated: refreshedAccount.deactivated,
    })

    if (expired) {
      logger.warn(`session: expired`)
      emitSessionDropped()
    }

    /*
     * If the session expired, or it was successfully created/updated, we want
     * to update/persist the data.
     *
     * If the session creation failed, it could be a network error, or it could
     * be more serious like an invalid token(s). We can't differentiate, so in
     * order to allow the user to get a fresh token (if they need it), we need
     * to persist this data and wipe their tokens, effectively logging them
     * out.
     */
    persistSessionCallback({
      expired,
      refreshedAccount,
    })
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const isDirty = React.useRef(false)
  const [state, setState] = React.useState<SessionState>({
    isInitialLoad: true,
    isSwitchingAccounts: false,
    accounts: persisted.get('session').accounts,
    currentAccount: undefined, // assume logged out to start
  })

  const setStateAndPersist = React.useCallback(
    (fn: (prev: SessionState) => SessionState) => {
      isDirty.current = true
      setState(fn)
    },
    [setState],
  )

  const upsertAccount = React.useCallback(
    (account: SessionAccount, expired = false) => {
      setStateAndPersist(s => {
        return {
          ...s,
          currentAccount: expired ? undefined : account,
          accounts: [account, ...s.accounts.filter(a => a.did !== account.did)],
        }
      })
    },
    [setStateAndPersist],
  )

  const clearCurrentAccount = React.useCallback(() => {
    logger.warn(`session: clear current account`)
    __globalAgent = PUBLIC_BSKY_AGENT
    setStateAndPersist(s => ({
      ...s,
      currentAccount: undefined,
    }))
  }, [setStateAndPersist])

  const createAccount = React.useCallback<ApiContext['createAccount']>(
    async ({
      service,
      email,
      password,
      handle,
      inviteCode,
      verificationPhone,
      verificationCode,
    }: any) => {
      logger.info(`session: creating account`)
      track('Try Create Account')
      logEvent('account:create:begin', {})

      const dispatcher = new SessionDispatcher({service})
      const agent = new BskyAgent(dispatcher)

      await dispatcher.createAccount({
        handle,
        password,
        email,
        inviteCode,
        verificationPhone,
        verificationCode,
      })

      if (!dispatcher.session) {
        throw new Error(`session: createAccount failed to establish a session`)
      }
      const fetchingGates = tryFetchGates(
        dispatcher.session.did,
        'prefer-fresh-gates',
      )

      const deactivated = isSessionDeactivated(dispatcher.session.accessJwt)
      if (!deactivated) {
        /*dont await*/ agent.upsertProfile(_existing => {
          return {
            displayName: '',

            // HACKFIX
            // creating a bunch of identical profile objects is breaking the relay
            // tossing this unspecced field onto it to reduce the size of the problem
            // -prf
            createdAt: new Date().toISOString(),
          }
        })
      }

      const account: SessionAccount = {
        service: dispatcher.serviceUrl.href,
        did: dispatcher.session.did,
        handle: dispatcher.session.handle,
        email: dispatcher.session.email!, // TODO this is always defined?
        emailConfirmed: false,
        refreshJwt: dispatcher.session.refreshJwt,
        accessJwt: dispatcher.session.accessJwt,
        deactivated,
        pdsUrl: dispatcher.pdsUrl?.toString(),
      }

      await configureModeration(agent, account)

      dispatcher.setPersistSessionHandler(
        createPersistSessionHandler(
          dispatcher,
          account,
          ({expired, refreshedAccount}) => {
            upsertAccount(refreshedAccount, expired)
          },
          {networkErrorCallback: clearCurrentAccount},
        ),
      )

      __globalAgent = agent
      await fetchingGates
      upsertAccount(account)

      logger.debug(`session: created account`, {}, logger.DebugContext.session)
      track('Create Account')
      logEvent('account:create:success', {})
    },
    [upsertAccount, clearCurrentAccount],
  )

  const login = React.useCallback<ApiContext['login']>(
    async ({service, identifier, password, authFactorToken}, logContext) => {
      logger.debug(`session: login`, {}, logger.DebugContext.session)

      const dispatcher = new SessionDispatcher({service})
      const agent = new BskyAgent(dispatcher)

      await dispatcher.login({identifier, password, authFactorToken})

      if (!dispatcher.session) {
        throw new Error(`session: login failed to establish a session`)
      }
      const fetchingGates = tryFetchGates(
        dispatcher.session.did,
        'prefer-fresh-gates',
      )

      const account: SessionAccount = {
        service: dispatcher.serviceUrl.href,
        did: dispatcher.session.did,
        handle: dispatcher.session.handle,
        email: dispatcher.session.email,
        emailConfirmed: dispatcher.session.emailConfirmed || false,
        emailAuthFactor: dispatcher.session.emailAuthFactor,
        refreshJwt: dispatcher.session.refreshJwt,
        accessJwt: dispatcher.session.accessJwt,
        deactivated: isSessionDeactivated(dispatcher.session.accessJwt),
        pdsUrl: dispatcher.pdsUrl?.toString(),
      }

      await configureModeration(agent, account)

      dispatcher.setPersistSessionHandler(
        createPersistSessionHandler(
          dispatcher,
          account,
          ({expired, refreshedAccount}) => {
            upsertAccount(refreshedAccount, expired)
          },
          {networkErrorCallback: clearCurrentAccount},
        ),
      )

      __globalAgent = agent
      // @ts-ignore
      if (IS_DEV && isWeb) window.agent = agent
      await fetchingGates
      upsertAccount(account)

      logger.debug(`session: logged in`, {}, logger.DebugContext.session)

      track('Sign In', {resumedSession: false})
      logEvent('account:loggedIn', {logContext, withPassword: true})
    },
    [upsertAccount, clearCurrentAccount],
  )

  const logout = React.useCallback<ApiContext['logout']>(
    async logContext => {
      logger.debug(`session: logout`)
      clearCurrentAccount()
      setStateAndPersist(s => {
        return {
          ...s,
          accounts: s.accounts.map(a => ({
            ...a,
            refreshJwt: undefined,
            accessJwt: undefined,
          })),
        }
      })
      logEvent('account:loggedOut', {logContext})
    },
    [clearCurrentAccount, setStateAndPersist],
  )

  const initSession = React.useCallback<ApiContext['initSession']>(
    async account => {
      logger.debug(`session: initSession`, {}, logger.DebugContext.session)
      const fetchingGates = tryFetchGates(account.did, 'prefer-low-latency')

      const dispatcher = new SessionDispatcher({service: account.service})
      const agent = new BskyAgent(dispatcher)

      // restore the correct PDS URL if available
      if (account.pdsUrl) {
        dispatcher.pdsUrl = new URL(account.pdsUrl)
      }

      dispatcher.setPersistSessionHandler(
        createPersistSessionHandler(
          dispatcher,
          account,
          ({expired, refreshedAccount}) => {
            upsertAccount(refreshedAccount, expired)
          },
          {networkErrorCallback: clearCurrentAccount},
        ),
      )

      // @ts-ignore
      if (IS_DEV && isWeb) window.agent = agent
      await configureModeration(agent, account)

      let canReusePrevSession = false
      try {
        if (account.accessJwt) {
          const decoded = jwtDecode(account.accessJwt)
          if (decoded.exp) {
            const didExpire = Date.now() >= decoded.exp * 1000
            if (!didExpire) {
              canReusePrevSession = true
            }
          }
        }
      } catch (e) {
        logger.error(`session: could not decode jwt`)
      }

      const prevSession = {
        accessJwt: account.accessJwt || '',
        refreshJwt: account.refreshJwt || '',
        did: account.did,
        handle: account.handle,
        deactivated:
          isSessionDeactivated(account.accessJwt) || account.deactivated,
      }

      if (canReusePrevSession) {
        logger.debug(`session: attempting to reuse previous session`)

        dispatcher.session = prevSession

        __globalAgent = agent
        await fetchingGates
        upsertAccount(account)

        if (prevSession.deactivated) {
          // don't attempt to resume
          // use will be taken to the deactivated screen
          logger.debug(`session: reusing session for deactivated account`)
          return
        }

        // Intentionally not awaited to unblock the UI:
        resumeSessionWithFreshAccount()
          .then(freshAccount => {
            if (JSON.stringify(account) !== JSON.stringify(freshAccount)) {
              logger.info(
                `session: reuse of previous session returned a fresh account, upserting`,
              )
              upsertAccount(freshAccount)
            }
          })
          .catch(e => {
            /*
             * Note: `agent.persistSession` is also called when this fails, and
             * we handle that failure via `createPersistSessionHandler`
             */
            logger.info(`session: resumeSessionWithFreshAccount failed`, {
              message: e,
            })

            __globalAgent = PUBLIC_BSKY_AGENT
          })
      } else {
        logger.debug(`session: attempting to resume using previous session`)

        try {
          const freshAccount = await resumeSessionWithFreshAccount()
          __globalAgent = agent
          await fetchingGates
          upsertAccount(freshAccount)
        } catch (e) {
          /*
           * Note: `agent.persistSession` is also called when this fails, and
           * we handle that failure via `createPersistSessionHandler`
           */
          logger.info(`session: resumeSessionWithFreshAccount failed`, {
            message: e,
          })

          __globalAgent = PUBLIC_BSKY_AGENT
        }
      }

      async function resumeSessionWithFreshAccount(): Promise<SessionAccount> {
        logger.debug(`session: resumeSessionWithFreshAccount`)

        await networkRetry(1, () => dispatcher.resumeSession(prevSession))

        /*
         * If `agent.resumeSession` fails above, it'll throw. This is just to
         * make TypeScript happy.
         */
        if (!dispatcher.session) {
          throw new Error(`session: initSession failed to establish a session`)
        }

        // ensure changes in handle/email etc are captured on reload
        return {
          service: dispatcher.serviceUrl.href,
          did: dispatcher.session.did,
          handle: dispatcher.session.handle,
          email: dispatcher.session.email,
          emailConfirmed: dispatcher.session.emailConfirmed || false,
          emailAuthFactor: dispatcher.session.emailAuthFactor || false,
          refreshJwt: dispatcher.session.refreshJwt,
          accessJwt: dispatcher.session.accessJwt,
          deactivated: isSessionDeactivated(dispatcher.session.accessJwt),
          pdsUrl: dispatcher.pdsUrl?.toString(),
        }
      }
    },
    [upsertAccount, clearCurrentAccount],
  )

  const resumeSession = React.useCallback<ApiContext['resumeSession']>(
    async account => {
      try {
        if (account) {
          await initSession(account)
        }
      } catch (e) {
        logger.error(`session: resumeSession failed`, {message: e})
      } finally {
        setState(s => ({
          ...s,
          isInitialLoad: false,
        }))
      }
    },
    [initSession],
  )

  const removeAccount = React.useCallback<ApiContext['removeAccount']>(
    account => {
      setStateAndPersist(s => {
        return {
          ...s,
          accounts: s.accounts.filter(a => a.did !== account.did),
        }
      })
    },
    [setStateAndPersist],
  )

  const updateCurrentAccount = React.useCallback<
    ApiContext['updateCurrentAccount']
  >(
    account => {
      setStateAndPersist(s => {
        const currentAccount = s.currentAccount

        // ignore, should never happen
        if (!currentAccount) return s

        const updatedAccount = {
          ...currentAccount,
          handle: account.handle || currentAccount.handle,
          email: account.email || currentAccount.email,
          emailConfirmed:
            account.emailConfirmed !== undefined
              ? account.emailConfirmed
              : currentAccount.emailConfirmed,
          emailAuthFactor:
            account.emailAuthFactor !== undefined
              ? account.emailAuthFactor
              : currentAccount.emailAuthFactor,
        }

        return {
          ...s,
          currentAccount: updatedAccount,
          accounts: [
            updatedAccount,
            ...s.accounts.filter(a => a.did !== currentAccount.did),
          ],
        }
      })
    },
    [setStateAndPersist],
  )

  const selectAccount = React.useCallback<ApiContext['selectAccount']>(
    async (account, logContext) => {
      setState(s => ({...s, isSwitchingAccounts: true}))
      try {
        await initSession(account)
        setState(s => ({...s, isSwitchingAccounts: false}))
        logEvent('account:loggedIn', {logContext, withPassword: false})
      } catch (e) {
        // reset this in case of error
        setState(s => ({...s, isSwitchingAccounts: false}))
        // but other listeners need a throw
        throw e
      }
    },
    [setState, initSession],
  )

  React.useEffect(() => {
    if (isDirty.current) {
      isDirty.current = false
      persisted.write('session', {
        accounts: state.accounts,
        currentAccount: state.currentAccount,
      })
    }
  }, [state])

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      const session = persisted.get('session')

      logger.debug(`session: persisted onUpdate`, {})

      if (session.currentAccount && session.currentAccount.refreshJwt) {
        if (session.currentAccount?.did !== state.currentAccount?.did) {
          logger.debug(`session: persisted onUpdate, switching accounts`, {
            from: {
              did: state.currentAccount?.did,
              handle: state.currentAccount?.handle,
            },
            to: {
              did: session.currentAccount.did,
              handle: session.currentAccount.handle,
            },
          })

          initSession(session.currentAccount)
        } else {
          logger.debug(`session: persisted onUpdate, updating session`, {})

          /*
           * Use updated session in this tab's agent. Do not call
           * upsertAccount, since that will only persist the session that's
           * already persisted, and we'll get a loop between tabs.
           */
          // @ts-ignore we checked for `refreshJwt` above
          __globalAgent.session = session.currentAccount
        }
      } else if (!session.currentAccount && state.currentAccount) {
        logger.debug(
          `session: persisted onUpdate, logging out`,
          {},
          logger.DebugContext.session,
        )

        /*
         * No need to do a hard logout here. If we reach this, tokens for this
         * account have already been cleared either by an `expired` event
         * handled by `persistSession` (which nukes this accounts tokens only),
         * or by a `logout` call  which nukes all accounts tokens)
         */
        clearCurrentAccount()
      }

      setState(s => ({
        ...s,
        accounts: session.accounts,
        currentAccount: session.currentAccount,
      }))
    })
  }, [state, setState, clearCurrentAccount, initSession])

  const stateContext = React.useMemo(
    () => ({
      ...state,
      hasSession: !!state.currentAccount,
    }),
    [state],
  )

  const api = React.useMemo(
    () => ({
      createAccount,
      login,
      logout,
      initSession,
      resumeSession,
      removeAccount,
      selectAccount,
      updateCurrentAccount,
      clearCurrentAccount,
    }),
    [
      createAccount,
      login,
      logout,
      initSession,
      resumeSession,
      removeAccount,
      selectAccount,
      updateCurrentAccount,
      clearCurrentAccount,
    ],
  )

  return (
    <StateContext.Provider value={stateContext}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

async function configureModeration(agent: BskyAgent, account: SessionAccount) {
  if (IS_TEST_USER(account.handle)) {
    const did = (
      await agent
        .resolveHandle({handle: 'mod-authority.test'})
        .catch(_ => undefined)
    )?.data.did
    if (did) {
      console.warn('USING TEST ENV MODERATION')
      BskyAgent.configure({appLabelers: [did]})
    }
  } else {
    BskyAgent.configure({appLabelers: [BSKY_LABELER_DID]})
    const labelerDids = await readLabelers(account.did).catch(_ => {})
    if (labelerDids) {
      agent.configureLabelersHeader(
        labelerDids.filter(did => did !== BSKY_LABELER_DID),
      )
    }
  }
}

export function useSession() {
  return React.useContext(StateContext)
}

export function useSessionApi() {
  return React.useContext(ApiContext)
}

export function useRequireAuth() {
  const {hasSession} = useSession()
  const closeAll = useCloseAllActiveElements()
  const {signinDialogControl} = useGlobalDialogsControlContext()

  return React.useCallback(
    (fn: () => void) => {
      if (hasSession) {
        fn()
      } else {
        closeAll()
        signinDialogControl.open()
      }
    },
    [hasSession, signinDialogControl, closeAll],
  )
}

export function isSessionDeactivated(accessJwt: string | undefined) {
  if (accessJwt) {
    const sessData = jwtDecode(accessJwt)
    return (
      hasProp(sessData, 'scope') && sessData.scope === 'com.atproto.deactivated'
    )
  }
  return false
}

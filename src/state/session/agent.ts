import {
  AtpPersistSessionHandler,
  AtpSessionData,
  AtpSessionEvent,
  BskyAgent,
} from '@atproto/api'
import {TID} from '@atproto/common-web'

import {networkRetry} from '#/lib/async/retry'
import {
  DISCOVER_SAVED_FEED,
  IS_PROD_SERVICE,
  PUBLIC_BSKY_SERVICE,
  TIMELINE_SAVED_FEED,
} from '#/lib/constants'
import {tryFetchGates} from '#/lib/statsig/statsig'
import {getAge} from '#/lib/strings/time'
import {logger} from '#/logger'
import {snoozeEmailConfirmationPrompt} from '#/state/shell/reminders'
import {addSessionErrorLog} from './logging'
import {
  configureModerationForAccount,
  configureModerationForGuest,
} from './moderation'
import {SessionAccount} from './types'
import {isSessionExpired, isSignupQueued} from './util'

type SetPersistSessionHandler = (cb: AtpPersistSessionHandler) => void

export function createPublicAgent() {
  configureModerationForGuest() // Side effect but only relevant for tests
  return new BskyAgent({service: PUBLIC_BSKY_SERVICE})
}

export async function createAgentAndResume(
  storedAccount: SessionAccount,
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
  setPersistSessionHandler: SetPersistSessionHandler,
) {
  const agent = new BskyAgent({service: storedAccount.service})
  if (storedAccount.pdsUrl) {
    agent.sessionManager.pdsUrl = new URL(storedAccount.pdsUrl)
  }
  const gates = tryFetchGates(storedAccount.did, 'prefer-low-latency')
  const moderation = configureModerationForAccount(agent, storedAccount)
  const prevSession: AtpSessionData = sessionAccountToSession(storedAccount)
  if (isSessionExpired(storedAccount)) {
    await networkRetry(1, () => agent.resumeSession(prevSession))
  } else {
    agent.sessionManager.session = prevSession
    if (!storedAccount.signupQueued) {
      // Intentionally not awaited to unblock the UI:
      networkRetry(3, () => agent.resumeSession(prevSession)).catch(
        (e: any) => {
          logger.error(`networkRetry failed to resume session`, {
            status: e?.status || 'unknown',
            // this field name is ignored by Sentry scrubbers
            safeMessage: e?.message || 'unknown',
          })

          throw e
        },
      )
    }
  }

  return prepareAgent(
    agent,
    gates,
    moderation,
    onSessionChange,
    setPersistSessionHandler,
  )
}

export async function createAgentAndLogin(
  {
    service,
    identifier,
    password,
    authFactorToken,
  }: {
    service: string
    identifier: string
    password: string
    authFactorToken?: string
  },
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
  setPersistSessionHandler: SetPersistSessionHandler,
) {
  const agent = new BskyAgent({service})
  await agent.login({identifier, password, authFactorToken})

  const account = agentToSessionAccountOrThrow(agent)
  const gates = tryFetchGates(account.did, 'prefer-fresh-gates')
  const moderation = configureModerationForAccount(agent, account)
  return prepareAgent(
    agent,
    moderation,
    gates,
    onSessionChange,
    setPersistSessionHandler,
  )
}

export async function createAgentAndCreateAccount(
  {
    service,
    email,
    password,
    handle,
    birthDate,
    inviteCode,
    verificationPhone,
    verificationCode,
  }: {
    service: string
    email: string
    password: string
    handle: string
    birthDate: Date
    inviteCode?: string
    verificationPhone?: string
    verificationCode?: string
  },
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
  setPersistSessionHandler: SetPersistSessionHandler,
) {
  const agent = new BskyAgent({service})
  await agent.createAccount({
    email,
    password,
    handle,
    inviteCode,
    verificationPhone,
    verificationCode,
  })
  const account = agentToSessionAccountOrThrow(agent)
  const gates = tryFetchGates(account.did, 'prefer-fresh-gates')
  const moderation = configureModerationForAccount(agent, account)

  // Not awaited so that we can still get into onboarding.
  // This is OK because we won't let you toggle adult stuff until you set the date.
  if (IS_PROD_SERVICE(service)) {
    try {
      networkRetry(1, async () => {
        await agent.setPersonalDetails({birthDate: birthDate.toISOString()})
        await agent.overwriteSavedFeeds([
          {
            ...DISCOVER_SAVED_FEED,
            id: TID.nextStr(),
          },
          {
            ...TIMELINE_SAVED_FEED,
            id: TID.nextStr(),
          },
        ])

        if (getAge(birthDate) < 18) {
          await agent.api.com.atproto.repo.putRecord({
            repo: account.did,
            collection: 'chat.bsky.actor.declaration',
            rkey: 'self',
            record: {
              $type: 'chat.bsky.actor.declaration',
              allowIncoming: 'none',
            },
          })
        }
      })
    } catch (e: any) {
      logger.error(e, {
        context: `session: createAgentAndCreateAccount failed to save personal details and feeds`,
      })
    }
  } else {
    agent.setPersonalDetails({birthDate: birthDate.toISOString()})
  }

  try {
    // snooze first prompt after signup, defer to next prompt
    snoozeEmailConfirmationPrompt()
  } catch (e: any) {
    logger.error(e, {context: `session: failed snoozeEmailConfirmationPrompt`})
  }

  return prepareAgent(
    agent,
    gates,
    moderation,
    onSessionChange,
    setPersistSessionHandler,
  )
}

async function prepareAgent(
  agent: BskyAgent,
  // Not awaited in the calling code so we can delay blocking on them.
  gates: Promise<void>,
  moderation: Promise<void>,
  onSessionChange: (
    agent: BskyAgent,
    did: string,
    event: AtpSessionEvent,
  ) => void,
  setPersistSessionHandler: (cb: AtpPersistSessionHandler) => void,
) {
  // There's nothing else left to do, so block on them here.
  await Promise.all([gates, moderation])

  // Now the agent is ready.
  const account = agentToSessionAccountOrThrow(agent)
  setPersistSessionHandler(event => {
    onSessionChange(agent, account.did, event)
    if (event !== 'create' && event !== 'update') {
      addSessionErrorLog(account.did, event)
    }
  })
  return {agent, account}
}

export function agentToSessionAccountOrThrow(agent: BskyAgent): SessionAccount {
  const account = agentToSessionAccount(agent)
  if (!account) {
    throw Error('Expected an active session')
  }
  return account
}

export function agentToSessionAccount(
  agent: BskyAgent,
): SessionAccount | undefined {
  if (!agent.session) {
    return undefined
  }
  return {
    service: agent.service.toString(),
    did: agent.session.did,
    handle: agent.session.handle,
    email: agent.session.email,
    emailConfirmed: agent.session.emailConfirmed || false,
    emailAuthFactor: agent.session.emailAuthFactor || false,
    refreshJwt: agent.session.refreshJwt,
    accessJwt: agent.session.accessJwt,
    signupQueued: isSignupQueued(agent.session.accessJwt),
    active: agent.session.active,
    status: agent.session.status as SessionAccount['status'],
    pdsUrl: agent.pdsUrl?.toString(),
  }
}

export function sessionAccountToSession(
  account: SessionAccount,
): AtpSessionData {
  return {
    // Sorted in the same property order as when returned by BskyAgent (alphabetical).
    accessJwt: account.accessJwt ?? '',
    did: account.did,
    email: account.email,
    emailAuthFactor: account.emailAuthFactor,
    emailConfirmed: account.emailConfirmed,
    handle: account.handle,
    refreshJwt: account.refreshJwt ?? '',
    /**
     * @see https://github.com/bluesky-social/atproto/blob/c5d36d5ba2a2c2a5c4f366a5621c06a5608e361e/packages/api/src/agent.ts#L188
     */
    active: account.active ?? true,
    status: account.status,
  }
}

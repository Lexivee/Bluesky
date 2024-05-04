import {BSKY_LABELER_DID, BskyAgent} from '@atproto/api'

import {IS_TEST_USER} from '#/lib/constants'
import {readLabelers} from './agent-config'
import {SessionAccount} from './types'

export function configureModerationForGuest() {
  switchToBskyAppLabeler()
}

export async function configureModerationForAccount(
  agent: BskyAgent,
  account: SessionAccount,
) {
  // These are global side effects (which can break things!) but
  // Don't add any other global behavior here, you can only mess with the agent.
  switchToBskyAppLabeler()
  if (IS_TEST_USER(account.handle)) {
    await trySwitchToTestAppLabeler(agent)
  }

  const labelerDids = await readLabelers(account.did).catch(_ => {})
  if (labelerDids) {
    agent.configureLabelersHeader(
      labelerDids.filter(did => did !== BSKY_LABELER_DID),
    )
  } else {
    // If there are no headers in the storage, we'll not send them on the initial requests.
    // If we wanted to fix this, we could block on the preferences query here.
  }
}

function switchToBskyAppLabeler() {
  BskyAgent.configure({appLabelers: [BSKY_LABELER_DID]})
}

async function trySwitchToTestAppLabeler(agent: BskyAgent) {
  const did = (
    await agent
      .resolveHandle({handle: 'mod-authority.test'})
      .catch(_ => undefined)
  )?.data.did
  if (did) {
    console.warn('USING TEST ENV MODERATION')
    BskyAgent.configure({appLabelers: [did]})
  }
}

import * as persisted from '#/state/persisted'
import {OnboardingModel} from '../models/discovery/onboarding'
import {SessionModel} from '../models/session'
import {toHashCode} from 'lib/strings/helpers'

export function shouldRequestEmailConfirmation(
  session: SessionModel,
  onboarding: OnboardingModel,
) {
  const sess = session.currentSession
  if (!sess) {
    return false
  }
  if (sess.emailConfirmed) {
    return false
  }
  if (onboarding.isActive) {
    return false
  }
  // only prompt once
  if (persisted.get('reminders').lastEmailConfirm) {
    return false
  }
  const today = new Date()
  // shard the users into 2 day of the week buckets
  // (this is to avoid a sudden influx of email updates when
  // this feature rolls out)
  const code = toHashCode(sess.did) % 7
  if (code !== today.getDay() && code !== (today.getDay() + 1) % 7) {
    return false
  }
  return true
}

export function setEmailConfirmationRequested() {
  persisted.write('reminders', {
    ...persisted.get('reminders'),
    lastEmailConfirm: new Date().toISOString(),
  })
}

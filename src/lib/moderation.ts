import {ModerationCause, ProfileModeration} from '@atproto/api'

export interface ModerationCauseDescription {
  name: string
  description: string
}

export function describeModerationCause(
  cause: ModerationCause | undefined,
  context: 'account' | 'content',
): ModerationCauseDescription {
  if (!cause) {
    return {
      name: 'Content Warning',
      description:
        'Moderator has chosen to set a general warning on the content.',
    }
  }
  if (cause.type === 'blocking') {
    return {
      name: 'Blocked User',
      description: 'You have blocked this user. You cannot view their content.',
    }
  }
  if (cause.type === 'blocked-by') {
    return {
      name: 'Blocking You',
      description: 'This user has blocked you. You cannot view their content.',
    }
  }
  if (cause.type === 'muted') {
    if (cause.source.type === 'user') {
      return {
        name: context === 'account' ? 'Muted User' : 'Post by muted user',
        description: 'You have muted this user',
      }
    } else {
      return {
        name:
          context === 'account'
            ? `Muted by "${cause.source.list.name}"`
            : `Post by muted user ("${cause.source.list.name}")`,
        description: 'You have muted this user',
      }
    }
  }
  return cause.labelDef.strings[context].en
}

export function getProfileModerationCauses(
  moderation: ProfileModeration,
): ModerationCause[] {
  /*
  Gather everything on profile and account that blurs or alerts
  */
  return [
    moderation.decisions.profile.cause,
    ...moderation.decisions.profile.additionalCauses,
    moderation.decisions.account.cause,
    ...moderation.decisions.account.additionalCauses,
  ].filter(cause => {
    if (!cause) {
      return false
    }
    if (cause?.type === 'label') {
      if (
        cause.labelDef.onwarn === 'blur' ||
        cause.labelDef.onwarn === 'alert'
      ) {
        return true
      } else {
        return false
      }
    }
    return true
  }) as ModerationCause[]
}

export function isCauseALabelOnUri(
  cause: ModerationCause | undefined,
  uri: string,
): boolean {
  if (cause?.type !== 'label') {
    return false
  }
  return cause.label.uri === uri
}

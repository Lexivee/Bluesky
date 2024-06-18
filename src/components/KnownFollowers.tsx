import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Link, LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

const AVI_SIZE = 30
const AVI_BORDER = 1

/**
 * Shared logic to determine if `KnownFollowers` should be shown.
 *
 * Checks the # of actual returned users instead of the `count` value, because
 * `count` includes blocked users and `followers` does not.
 */
export function shouldShowKnownFollowers(
  knownFollowers?: AppBskyActorDefs.KnownFollowers,
) {
  return knownFollowers && knownFollowers.followers.length > 0
}

export function KnownFollowers({
  profile,
  moderationOpts,
  onLinkPress,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  onLinkPress?: LinkProps['onPress']
}) {
  const cache = React.useRef<Map<string, AppBskyActorDefs.KnownFollowers>>(
    new Map(),
  )

  /*
   * Results for `knownFollowers` are not sorted consistently, so when
   * revalidating we can see a flash of this data updating. This cache prevents
   * this happening for screens that remain in memory. When pushing a new
   * screen, or once this one is popped, this cache is empty, so new data is
   * displayed.
   */
  if (profile.viewer?.knownFollowers && !cache.current.has(profile.did)) {
    cache.current.set(profile.did, profile.viewer.knownFollowers)
  }

  const cachedKnownFollowers = cache.current.get(profile.did)

  if (cachedKnownFollowers && shouldShowKnownFollowers(cachedKnownFollowers)) {
    return (
      <KnownFollowersInner
        profile={profile}
        cachedKnownFollowers={cachedKnownFollowers}
        moderationOpts={moderationOpts}
        onLinkPress={onLinkPress}
      />
    )
  }

  return null
}

function KnownFollowersInner({
  profile,
  moderationOpts,
  cachedKnownFollowers,
  onLinkPress,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  cachedKnownFollowers: AppBskyActorDefs.KnownFollowers
  onLinkPress?: LinkProps['onPress']
}) {
  const t = useTheme()
  const {_} = useLingui()

  const textStyle = [
    a.flex_1,
    a.text_sm,
    a.leading_snug,
    t.atoms.text_contrast_medium,
  ]

  const slice = cachedKnownFollowers.followers.slice(0, 3).map(f => {
    const moderation = moderateProfile(f, moderationOpts)
    return {
      profile: {
        ...f,
        displayName: sanitizeDisplayName(
          f.displayName || f.handle,
          moderation.ui('displayName'),
        ),
      },
      moderation,
    }
  })
  const count = cachedKnownFollowers.count

  return (
    <Link
      label={_(
        msg`Press to view followers of this account that you also follow`,
      )}
      onPress={onLinkPress}
      to={makeProfileLink(profile, 'known-followers')}
      style={[
        a.flex_1,
        a.flex_row,
        a.gap_md,
        a.align_center,
        {marginLeft: -AVI_BORDER},
      ]}>
      {({hovered, pressed}) => (
        <>
          <View
            style={[
              {
                height: AVI_SIZE,
                width: AVI_SIZE + (slice.length - 1) * a.gap_md.gap,
              },
              pressed && {
                opacity: 0.5,
              },
            ]}>
            {slice.map(({profile: prof, moderation}, i) => (
              <View
                key={prof.did}
                style={[
                  a.absolute,
                  a.rounded_full,
                  {
                    borderWidth: AVI_BORDER,
                    borderColor: t.atoms.bg.backgroundColor,
                    width: AVI_SIZE + AVI_BORDER * 2,
                    height: AVI_SIZE + AVI_BORDER * 2,
                    left: i * a.gap_md.gap,
                    zIndex: AVI_BORDER - i,
                  },
                ]}>
                <UserAvatar
                  size={AVI_SIZE}
                  avatar={prof.avatar}
                  moderation={moderation.ui('avatar')}
                />
              </View>
            ))}
          </View>

          <Text
            style={[
              textStyle,
              hovered && {
                textDecorationLine: 'underline',
                textDecorationColor: t.atoms.text_contrast_medium.color,
              },
              pressed && {
                opacity: 0.5,
              },
            ]}
            numberOfLines={2}>
            {count > 2 ? (
              <Trans>
                Followed by{' '}
                <Text key={slice[0].profile.did} style={textStyle}>
                  {slice[0].profile.displayName}
                </Text>
                ,{' '}
                <Text key={slice[1].profile.did} style={textStyle}>
                  {slice[1].profile.displayName}
                </Text>
                , and{' '}
                <Plural value={count - 2} one="# other" other="# others" />
              </Trans>
            ) : count === 2 ? (
              <Trans>
                Followed by{' '}
                <Text key={slice[0].profile.did} style={textStyle}>
                  {slice[0].profile.displayName}
                </Text>{' '}
                and{' '}
                <Text key={slice[1].profile.did} style={textStyle}>
                  {slice[1].profile.displayName}
                </Text>
              </Trans>
            ) : (
              <Trans>
                Followed by{' '}
                <Text key={slice[0].profile.did} style={textStyle}>
                  {slice[0].profile.displayName}
                </Text>
              </Trans>
            )}
          </Text>
        </>
      )}
    </Link>
  )
}

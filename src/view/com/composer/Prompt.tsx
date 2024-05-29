import React from 'react'
import {TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {UserAvatar} from '../util/UserAvatar'

export function ComposePrompt({onPressCompose}: {onPressCompose: () => void}) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {_} = useLingui()
  const {isTabletOrDesktop} = useWebMediaQueries()
  return (
    <TouchableOpacity
      testID="replyPromptBtn"
      style={[
        isTabletOrDesktop ? a.p_md : a.p_sm,
        a.border_t,
        t.atoms.border_contrast_medium,
        t.atoms.bg,
      ]}
      onPress={() => onPressCompose()}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Compose reply`)}
      accessibilityHint={_(msg`Opens composer`)}
      activeOpacity={0.925}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.gap_sm,
          !isTabletOrDesktop && a.mb_xs,
        ]}>
        <UserAvatar
          avatar={profile?.avatar}
          size={isTabletOrDesktop ? 36 : 28}
          type={profile?.associated?.labeler ? 'labeler' : 'user'}
        />
        <Text style={[a.text_md, t.atoms.text_contrast_high]}>
          <Trans>Write your reply</Trans>
        </Text>
      </View>
    </TouchableOpacity>
  )
}

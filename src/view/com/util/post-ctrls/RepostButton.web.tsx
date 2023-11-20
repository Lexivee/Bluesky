import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle, Pressable} from 'react-native'
import {RepostIcon} from 'lib/icons'
import {colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {Text} from '../text/Text'

import {
  NativeDropdown,
  DropdownItem as NativeDropdownItem,
} from '../forms/NativeDropdown'
import {EventStopper} from '../EventStopper'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {useAuthedMethod} from '#/state/session'
import {useSession} from '#/state/session'

interface Props {
  isReposted: boolean
  repostCount?: number
  big?: boolean
  onRepost: () => void
  onQuote: () => void
  style?: StyleProp<ViewStyle>
}

export const RepostButton = ({
  isReposted,
  repostCount,
  big,
  onRepost,
  onQuote,
}: Props) => {
  const theme = useTheme()
  const {_} = useLingui()
  const {hasSession} = useSession()
  const authedMethod = useAuthedMethod()

  const defaultControlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  )

  const dropdownItems: NativeDropdownItem[] = [
    {
      label: isReposted ? 'Undo repost' : 'Repost',
      testID: 'repostDropdownRepostBtn',
      icon: {
        ios: {name: 'repeat'},
        android: '',
        web: 'retweet',
      },
      onPress: onRepost,
    },
    {
      label: 'Quote post',
      testID: 'repostDropdownQuoteBtn',
      icon: {
        ios: {name: 'quote.bubble'},
        android: '',
        web: 'quote-left',
      },
      onPress: onQuote,
    },
  ]

  return hasSession ? (
    <EventStopper>
      <NativeDropdown
        items={dropdownItems}
        accessibilityLabel={_(msg`Repost or quote post`)}
        accessibilityHint="">
        <View
          style={[
            styles.control,
            !big && styles.controlPad,
            (isReposted
              ? styles.reposted
              : defaultControlColor) as StyleProp<ViewStyle>,
          ]}>
          <RepostIcon strokeWidth={2.2} size={big ? 24 : 20} />
          {typeof repostCount !== 'undefined' ? (
            <Text
              testID="repostCount"
              type={isReposted ? 'md-bold' : 'md'}
              style={styles.repostCount}>
              {repostCount ?? 0}
            </Text>
          ) : undefined}
        </View>
      </NativeDropdown>
    </EventStopper>
  ) : (
    <Pressable accessibilityRole="button" onPress={authedMethod(() => {})}>
      <View
        style={[
          styles.control,
          !big && styles.controlPad,
          (isReposted
            ? styles.reposted
            : defaultControlColor) as StyleProp<ViewStyle>,
        ]}>
        <RepostIcon strokeWidth={2.2} size={big ? 24 : 20} />
        {typeof repostCount !== 'undefined' ? (
          <Text
            testID="repostCount"
            type={isReposted ? 'md-bold' : 'md'}
            style={styles.repostCount}>
            {repostCount ?? 0}
          </Text>
        ) : undefined}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  control: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlPad: {
    padding: 5,
  },
  reposted: {
    color: colors.green3,
  },
  repostCount: {
    color: 'currentColor',
  },
})

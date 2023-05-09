import React, {useMemo} from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {RepostIcon} from 'lib/icons'
import {DropdownButton} from './forms/DropdownButton'
import {colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {Text} from './text/Text'

interface Props {
  isReposted: boolean
  repostCount?: number
  big?: boolean
  onRepost: () => void
  onQuote: () => void
}

export const RepostButton = ({
  isReposted,
  repostCount,
  big,
  onRepost,
  onQuote,
}: Props) => {
  const theme = useTheme()

  const controlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  )

  const items = useMemo(
    () => [
      {
        label: isReposted ? 'Undo repost' : 'Repost',
        icon: 'retweet' as const,
        onPress: onRepost,
      },
      {label: 'Quote post', icon: 'quote-left' as const, onPress: onQuote},
    ],
    [isReposted, onRepost, onQuote],
  )

  return (
    <DropdownButton type="bare" items={items} bottomOffset={4} openToRight>
      <View
        style={[
          styles.control,
          (isReposted ? styles.reposted : controlColor) as StyleProp<ViewStyle>,
        ]}>
        <RepostIcon strokeWidth={2.4} size={big ? 24 : 20} />
        {typeof repostCount !== 'undefined' ? (
          <Text
            testID="repostCount"
            type={isReposted ? 'md-bold' : 'md-medium'}
            style={styles.repostCount}>
            {repostCount ?? 0}
          </Text>
        ) : undefined}
      </View>
    </DropdownButton>
  )
}

const styles = StyleSheet.create({
  control: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reposted: {
    color: colors.green3,
  },
  repostCount: {
    color: 'currentColor',
  },
})

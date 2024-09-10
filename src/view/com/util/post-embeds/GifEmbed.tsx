import React from 'react'
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {AppBskyEmbedExternal} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_20} from '#/lib/constants'
import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {isWeb} from '#/platform/detection'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {EmbedPlayerParams} from 'lib/strings/embed-player'
import {useAutoplayDisabled} from 'state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {PlayButtonIcon} from '#/components/video/PlayButtonIcon'
import {GifView} from '../../../../../modules/expo-bluesky-gif-view'
import {GifViewStateChangeEvent} from '../../../../../modules/expo-bluesky-gif-view/src/GifView.types'

function PlaybackControls({
  onPress,
  isPlaying,
  isLoaded,
}: {
  onPress: () => void
  isPlaying: boolean
  isLoaded: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={_(msg`Play or pause the GIF`)}
      accessibilityLabel={isPlaying ? _(msg`Pause`) : _(msg`Play`)}
      style={[
        a.absolute,
        a.align_center,
        a.justify_center,
        !isLoaded && a.border,
        t.atoms.border_contrast_medium,
        a.inset_0,
        a.w_full,
        a.h_full,
        a.rounded_sm,
        {
          zIndex: 2,
          backgroundColor: !isLoaded
            ? t.atoms.bg_contrast_25.backgroundColor
            : !isPlaying
            ? 'rgba(0, 0, 0, 0.3)'
            : undefined,
        },
      ]}
      onPress={onPress}>
      {!isLoaded ? (
        <View>
          <View style={[a.align_center, a.justify_center]}>
            <Loader size="xl" />
          </View>
        </View>
      ) : !isPlaying ? (
        <PlayButtonIcon />
      ) : undefined}
    </Pressable>
  )
}

export function GifEmbed({
  params,
  link,
  hideAlt,
  style = {width: '100%'},
}: {
  params: EmbedPlayerParams
  link: AppBskyEmbedExternal.ViewExternal
  hideAlt?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const autoplayDisabled = useAutoplayDisabled()

  const playerRef = React.useRef<GifView>(null)

  const [playerState, setPlayerState] = React.useState<{
    isPlaying: boolean
    isLoaded: boolean
  }>({
    isPlaying: !autoplayDisabled,
    isLoaded: false,
  })

  const onPlayerStateChange = React.useCallback(
    (e: GifViewStateChangeEvent) => {
      setPlayerState(e.nativeEvent)
    },
    [],
  )

  const onPress = React.useCallback(() => {
    playerRef.current?.toggleAsync()
  }, [])

  const parsedAlt = React.useMemo(
    () => parseAltFromGIFDescription(link.description),
    [link],
  )

  return (
    <View style={[a.rounded_sm, a.overflow_hidden, a.mt_sm, style]}>
      <View
        style={[
          a.rounded_sm,
          a.overflow_hidden,
          {aspectRatio: params.dimensions!.width / params.dimensions!.height},
        ]}>
        <PlaybackControls
          onPress={onPress}
          isPlaying={playerState.isPlaying}
          isLoaded={playerState.isLoaded}
        />
        <GifView
          source={params.playerUri}
          placeholderSource={link.thumb}
          style={[a.flex_1, a.rounded_sm]}
          autoplay={!autoplayDisabled}
          onPlayerStateChange={onPlayerStateChange}
          ref={playerRef}
          accessibilityHint={_(msg`Animated GIF`)}
          accessibilityLabel={parsedAlt.alt}
        />
        <View
          style={[
            a.absolute,
            a.w_full,
            a.h_full,
            a.border,
            a.rounded_sm,
            {
              borderColor: t.palette.contrast_800,
              opacity: 0.2,
            },
          ]}
        />
        {!hideAlt && parsedAlt.isPreferred && <AltText text={parsedAlt.alt} />}
      </View>
    </View>
  )
}

function AltText({text}: {text: string}) {
  const control = Prompt.usePromptControl()
  const largeAltBadge = useLargeAltBadgeEnabled()

  const {_} = useLingui()
  return (
    <>
      <TouchableOpacity
        testID="altTextButton"
        accessibilityRole="button"
        accessibilityLabel={_(msg`Show alt text`)}
        accessibilityHint=""
        hitSlop={HITSLOP_20}
        onPress={control.open}
        style={styles.altContainer}>
        <Text
          style={[styles.alt, largeAltBadge && a.text_xs]}
          accessible={false}>
          <Trans>ALT</Trans>
        </Text>
      </TouchableOpacity>
      <Prompt.Outer control={control}>
        <Prompt.TitleText>
          <Trans>Alt Text</Trans>
        </Prompt.TitleText>
        <Prompt.DescriptionText selectable>{text}</Prompt.DescriptionText>
        <Prompt.Actions>
          <Prompt.Action
            onPress={() => control.close()}
            cta={_(msg`Close`)}
            color="secondary"
          />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}

const styles = StyleSheet.create({
  altContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: isWeb ? 8 : 6,
    paddingVertical: isWeb ? 6 : 3,
    position: 'absolute',
    // Related to margin/gap hack. This keeps the alt label in the same position
    // on all platforms
    right: isWeb ? 8 : 5,
    bottom: isWeb ? 8 : 5,
    zIndex: 2,
  },
  alt: {
    color: 'white',
    fontSize: isWeb ? 10 : 7,
    fontWeight: 'bold',
  },
})

import React from 'react'
import {ImageStyle, useWindowDimensions, View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {enforceLen} from '#/lib/strings/helpers'
import {isAndroid, isWeb} from '#/platform/detection'
import {ComposerImage} from '#/state/gallery'
import {AltTextCounterWrapper} from '#/view/com/composer/AltTextCounterWrapper'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {PortalComponent} from '#/components/Portal'
import {Text} from '#/components/Typography'

type Props = {
  control: Dialog.DialogOuterProps['control']
  image: ComposerImage
  onChange: (next: ComposerImage) => void
  Portal: PortalComponent
}

export const ImageAltTextDialog = ({
  control,
  image,
  onChange,
  Portal,
}: Props): React.ReactNode => {
  const altTextRef = React.useRef<string>(image.alt)

  const onSubmit = (text: string) => {
    control.close()
    onChange({
      ...image,
      alt: enforceLen(text, MAX_ALT_TEXT, true),
    })
  }

  return (
    <Dialog.Outer
      control={control}
      onClose={() => {
        onSubmit(altTextRef.current)
      }}
      Portal={Portal}>
      <Dialog.Handle />
      <ImageAltTextInner
        image={image}
        altTextRef={altTextRef}
        onSubmit={onSubmit}
      />
    </Dialog.Outer>
  )
}

const ImageAltTextInner = ({
  image,
  altTextRef,
  onSubmit,
}: {
  image: Props['image']
  altTextRef: React.MutableRefObject<string>
  onSubmit: (text: string) => void
}): React.ReactNode => {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const windim = useWindowDimensions()
  const [altText, setAltText] = React.useState(image.alt)

  const onPressSubmit = () => {
    onSubmit(altText)
  }

  const imageStyle = React.useMemo<ImageStyle>(() => {
    const maxWidth = isWeb ? 450 : windim.width
    const source = image.transformed ?? image.source

    if (source.height > source.width) {
      return {
        resizeMode: 'contain',
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
      }
    }
    return {
      width: '100%',
      height: (maxWidth / source.width) * source.height,
      borderRadius: 8,
    }
  }, [image, windim])

  return (
    <Dialog.ScrollableInner label={_(msg`Add alt text`)}>
      <Dialog.Close />

      <View>
        <Text style={[a.text_2xl, a.font_bold, a.leading_tight, a.pb_sm]}>
          <Trans>Add alt text</Trans>
        </Text>

        <View style={[t.atoms.bg_contrast_50, a.rounded_sm, a.overflow_hidden]}>
          <Image
            style={imageStyle}
            source={{
              uri: (image.transformed ?? image.source).path,
            }}
            contentFit="contain"
            accessible={true}
            accessibilityIgnoresInvertColors
            enableLiveTextInteraction
          />
        </View>
      </View>

      <View style={[a.mt_md, a.gap_md]}>
        <View style={[a.gap_sm]}>
          <View style={[a.relative, {width: '100%'}]}>
            <TextField.LabelText>
              <Trans>Descriptive alt text</Trans>
            </TextField.LabelText>
            <TextField.Root>
              <Dialog.Input
                label={_(msg`Alt text`)}
                onChangeText={text => {
                  altTextRef.current = text
                  setAltText(text)
                }}
                value={altText}
                multiline
                numberOfLines={3}
                autoFocus
              />
            </TextField.Root>
          </View>

          {altText.length > MAX_ALT_TEXT && (
            <View style={[a.pb_sm, a.flex_row, a.gap_xs]}>
              <CircleInfo fill={t.palette.negative_500} />
              <Text
                style={[
                  a.italic,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Alt text will be truncated. Limit: {i18n.number(MAX_ALT_TEXT)}{' '}
                  characters.
                </Trans>
              </Text>
            </View>
          )}
        </View>

        <AltTextCounterWrapper altText={altText}>
          <Button
            label={_(msg`Save`)}
            disabled={altText === image.alt}
            size="large"
            color="primary"
            variant="solid"
            onPress={onPressSubmit}
            style={[a.flex_grow]}>
            <ButtonText>
              <Trans>Save</Trans>
            </ButtonText>
          </Button>
        </AltTextCounterWrapper>
      </View>
      {/* Maybe fix this later -h */}
      {isAndroid ? <View style={{height: 300}} /> : null}
    </Dialog.ScrollableInner>
  )
}

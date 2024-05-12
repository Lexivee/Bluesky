import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {saveBytesToDisk} from '#/lib/media/manip'
import {useAgent} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function ExportCarDialog({
  control,
}: {
  control: Dialog.DialogOuterProps['control']
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {getAgent} = useAgent()
  const [loading, setLoading] = React.useState(false)

  const download = React.useCallback(async () => {
    const agent = getAgent()
    if (!agent.session) {
      return // shouldnt ever happen
    }
    try {
      setLoading(true)
      const did = agent.session.did
      const res = await agent.com.atproto.sync.getRepo({did})
      await saveBytesToDisk('repo.car', res.data, res.headers['content-type'])
    } finally {
      setLoading(false)
      control.close()
    }
  }, [control, getAgent])

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        accessibilityDescribedBy="dialog-description"
        accessibilityLabelledBy="dialog-title">
        <View style={[a.relative, a.gap_lg, a.w_full]}>
          <Text nativeID="dialog-title" style={[a.text_2xl, a.font_bold]}>
            <Trans>Export My Data</Trans>
          </Text>
          <Text nativeID="dialog-description" style={[a.text_sm]}>
            <Trans>
              Your account repository, containing all public data records, can
              be downloaded as a "CAR" file. This file does not include media
              embeds, such as images, or your private data, which must be
              fetched separately.
            </Trans>
          </Text>

          <Button
            variant="solid"
            color="primary"
            size="large"
            label={_(msg`Download CAR file`)}
            disabled={loading}
            onPress={download}>
            <ButtonText>
              <Trans>Download CAR file</Trans>
            </ButtonText>
            {loading && <ButtonIcon icon={Loader} />}
          </Button>

          <Text
            style={[
              t.atoms.text_contrast_medium,
              a.text_sm,
              a.leading_snug,
              a.flex_1,
            ]}>
            <Trans>
              This feature is in beta. You can read more about repository
              exports in{' '}
              <InlineLinkText
                to="https://docs.bsky.app/blog/repo-export"
                style={[a.text_sm]}>
                this blogpost
              </InlineLinkText>
              .
            </Trans>
          </Text>

          {!gtMobile && <View style={{height: 40}} />}
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

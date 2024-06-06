import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useSetMinimalShellMode} from '#/state/shell'
import {HELP_DESK_URL} from 'lib/constants'
import {usePalette} from 'lib/hooks/usePalette'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {s} from 'lib/styles'
import {TextLink} from 'view/com/util/Link'
import {Text} from 'view/com/util/text/Text'
import {CenteredView} from 'view/com/util/Views'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Support'>
export const SupportScreen = (_props: Props) => {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {_} = useLingui()

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View>
      <ViewHeader title={_(msg`Support`)} />
      <CenteredView>
        <Text type="title-xl" style={[pal.text, s.p20, s.pb5]}>
          <Trans>Support</Trans>
        </Text>
        <Text style={[pal.text, s.p20]}>
          <Trans>
            The support form has been moved. If you need help, please{' '}
            <TextLink
              href={HELP_DESK_URL}
              text={_(msg`click here`)}
              style={pal.link}
            />{' '}
            or visit {HELP_DESK_URL} to get in touch with us.
          </Trans>
        </Text>
      </CenteredView>
    </View>
  )
}

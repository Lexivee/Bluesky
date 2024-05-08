import React, {useCallback} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {AppBskyActorDefs} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {useCurrentConvoId} from '#/state/messages/current-convo-id'
import {BACK_HITSLOP} from 'lib/constants'
import {isWeb} from 'platform/detection'
import {ConvoProvider, useConvo} from 'state/messages/convo'
import {ConvoStatus} from 'state/messages/convo/types'
import {PreviewableUserAvatar} from 'view/com/util/UserAvatar'
import {CenteredView} from 'view/com/util/Views'
import {MessagesList} from '#/screens/Messages/Conversation/MessagesList'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'
import {ClipClopGate} from '../gate'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesConversation'
>
export function MessagesConversationScreen({route}: Props) {
  const gate = useGate()
  const convoId = route.params.conversation
  const {setCurrentConvoId} = useCurrentConvoId()

  useFocusEffect(
    useCallback(() => {
      setCurrentConvoId(convoId)
      return () => {
        setCurrentConvoId(undefined)
      }
    }, [convoId, setCurrentConvoId]),
  )

  if (!gate('dms')) return <ClipClopGate />

  return (
    <ConvoProvider convoId={convoId}>
      <Inner />
    </ConvoProvider>
  )
}

function Inner() {
  const convo = useConvo()

  if (
    convo.status === ConvoStatus.Uninitialized ||
    convo.status === ConvoStatus.Initializing
  ) {
    return <ListMaybePlaceholder isLoading />
  }

  if (convo.status === ConvoStatus.Error) {
    // TODO
    return (
      <View>
        <CenteredView style={{flex: 1}} sideBorders>
          <Text>Something went wrong</Text>
          <Button
            label="Retry"
            onPress={() => {
              convo.error.retry()
            }}>
            <ButtonText>Retry</ButtonText>
          </Button>
        </CenteredView>
      </View>
    )
  }

  /*
   * Any other convo states (atm) are "ready" states
   */

  return (
    <KeyboardProvider>
      <CenteredView style={{flex: 1}} sideBorders>
        <Header profile={convo.recipients[0]} />
        <MessagesList />
      </CenteredView>
    </KeyboardProvider>
  )
}

let Header = ({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const {gtTablet} = useBreakpoints()
  const navigation = useNavigation<NavigationProp>()
  const convo = useConvo()

  const onPressBack = useCallback(() => {
    if (isWeb) {
      navigation.replace('Messages')
    } else {
      navigation.reset({
        index: 0,
        routes: [{name: 'Messages'}],
      })
    }
  }, [navigation])

  const onUpdateConvo = useCallback(() => {
    // TODO eric update muted state
  }, [])

  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.border_b,
        a.flex_row,
        a.justify_between,
        a.align_start,
        a.gap_lg,
        a.px_lg,
        a.py_sm,
      ]}>
      {!gtTablet ? (
        <TouchableOpacity
          testID="conversationHeaderBackBtn"
          onPress={onPressBack}
          hitSlop={BACK_HITSLOP}
          style={{width: 30, height: 30}}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Back`)}
          accessibilityHint="">
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={{
              marginTop: 6,
            }}
            color={t.atoms.text.color}
          />
        </TouchableOpacity>
      ) : (
        <View style={{width: 30}} />
      )}
      <View style={[a.align_center, a.gap_sm, a.flex_1]}>
        <PreviewableUserAvatar size={32} profile={profile} />
        <Text style={[a.text_lg, a.font_bold, a.text_center]}>
          {profile.displayName}
        </Text>
      </View>
      {convo.status === ConvoStatus.Ready ? (
        <ConvoMenu
          convo={convo.convo}
          profile={profile}
          onUpdateConvo={onUpdateConvo}
          currentScreen="conversation"
        />
      ) : (
        <View style={{width: 30}} />
      )}
    </View>
  )
}
Header = React.memo(Header)

import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import isEqual from 'lodash.isequal'

import {useMyListsQuery} from '#/state/queries/my-lists'
import {ThreadgateSetting} from '#/state/queries/threadgate'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Text} from '#/components/Typography'

interface ThreadgateEditorDialogProps {
  control: Dialog.DialogControlProps
  threadgate: ThreadgateSetting[]
  onChange?: (v: ThreadgateSetting[]) => void
  onConfirm?: (v: ThreadgateSetting[]) => void
}

export function ThreadgateEditorDialog({
  control,
  threadgate,
  onChange,
  onConfirm,
}: ThreadgateEditorDialogProps) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <DialogContent
        // The dialog mirrors the threadgate state inside
        // so we must reset it if a new value flows down.
        key={JSON.stringify(threadgate)}
        initialThreadgate={threadgate}
        onChange={onChange}
        onConfirm={onConfirm}
      />
    </Dialog.Outer>
  )
}

function DialogContent({
  initialThreadgate,
  onChange,
  onConfirm,
}: {
  initialThreadgate: ThreadgateSetting[]
  onChange?: (v: ThreadgateSetting[]) => void
  onConfirm?: (v: ThreadgateSetting[]) => void
}) {
  const {_} = useLingui()
  const control = Dialog.useDialogContext()
  const {data: lists} = useMyListsQuery('curate')
  const [draft, setDraft] = React.useState(initialThreadgate)

  function updateThreadgate(nextThreadgate: ThreadgateSetting[]) {
    setDraft(nextThreadgate)
    onChange?.(nextThreadgate)
  }

  const onPressEverybody = () => {
    updateThreadgate([])
  }

  const onPressNobody = () => {
    updateThreadgate([{type: 'nobody'}])
  }

  const onPressAudience = (setting: ThreadgateSetting) => {
    // remove nobody
    let newSelected = draft.filter(v => v.type !== 'nobody')
    // toggle
    const i = newSelected.findIndex(v => isEqual(v, setting))
    if (i === -1) {
      newSelected.push(setting)
    } else {
      newSelected.splice(i, 1)
    }
    updateThreadgate(newSelected)
  }

  return (
    <Dialog.ScrollableInner
      label={_(msg`Choose who can reply`)}
      style={[{maxWidth: 500}, a.w_full]}>
      <View style={[a.flex_1, a.gap_md]}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Chose who can reply</Trans>
        </Text>
        <Text style={a.mt_xs}>
          <Trans>Either choose "Everybody" or "Nobody"</Trans>
        </Text>
        <View style={[a.flex_row, a.gap_sm]}>
          <Selectable
            label={_(msg`Everybody`)}
            isSelected={draft.length === 0}
            onPress={onPressEverybody}
            style={{flex: 1}}
          />
          <Selectable
            label={_(msg`Nobody`)}
            isSelected={!!draft.find(v => v.type === 'nobody')}
            onPress={onPressNobody}
            style={{flex: 1}}
          />
        </View>
        <Text style={a.mt_md}>
          <Trans>Or combine these options:</Trans>
        </Text>
        <View style={[a.gap_sm]}>
          <Selectable
            label={_(msg`Mentioned users`)}
            isSelected={!!draft.find(v => v.type === 'mention')}
            onPress={() => onPressAudience({type: 'mention'})}
          />
          <Selectable
            label={_(msg`Followed users`)}
            isSelected={!!draft.find(v => v.type === 'following')}
            onPress={() => onPressAudience({type: 'following'})}
          />
          {lists && lists.length > 0
            ? lists.map(list => (
                <Selectable
                  key={list.uri}
                  label={_(msg`Users in "${list.name}"`)}
                  isSelected={
                    !!draft.find(v => v.type === 'list' && v.list === list.uri)
                  }
                  onPress={() =>
                    onPressAudience({type: 'list', list: list.uri})
                  }
                />
              ))
            : // No loading states to avoid jumps for the common case (no lists)
              null}
        </View>
      </View>
      <Button
        label={_(msg`Done`)}
        onPress={() => {
          control.close()
          onConfirm?.(draft)
        }}
        onAccessibilityEscape={control.close}
        color="primary"
        size="medium"
        variant="solid"
        style={a.mt_xl}>
        <ButtonText>
          <Trans>Done</Trans>
        </ButtonText>
      </Button>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function Selectable({
  label,
  isSelected,
  onPress,
  style,
}: {
  label: string
  isSelected: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <Button
      onPress={onPress}
      label={label}
      accessibilityHint="Select this option"
      accessibilityRole="checkbox"
      aria-checked={isSelected}
      accessibilityState={{
        checked: isSelected,
      }}
      style={a.flex_1}>
      {({hovered, focused}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.rounded_sm,
            a.p_md,
            {height: 40}, // for consistency with checkmark icon visible or not
            t.atoms.bg_contrast_50,
            (hovered || focused) && t.atoms.bg_contrast_100,
            isSelected && {
              backgroundColor:
                t.name === 'light'
                  ? t.palette.primary_50
                  : t.palette.primary_975,
            },
            style,
          ]}>
          <Text style={[a.text_sm, isSelected && a.font_semibold]}>
            {label}
          </Text>
          {isSelected ? (
            <Check size="sm" fill={t.palette.primary_500} />
          ) : (
            <View />
          )}
        </View>
      )}
    </Button>
  )
}

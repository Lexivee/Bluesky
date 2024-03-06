import React from 'react'
import {GestureResponderEvent, PressableProps} from 'react-native'

import {Props as SVGIconProps} from '#/components/icons/common'
import * as Dialog from '#/components/Dialog'
import {TextStyleProp, ViewStyleProp} from '#/alf'

export type ContextType = {
  control: Dialog.DialogOuterProps['control']
}

export type TriggerProps = ViewStyleProp & {
  children(props: TriggerChildProps): React.ReactNode
  label: string
}
export type TriggerChildProps =
  | {
      isNative: true
      control: Dialog.DialogOuterProps['control']
      state: {
        /**
         * Web only, `false` on native
         */
        hovered: false
        focused: boolean
        pressed: boolean
      }
      /**
       * We don't necessarily know what these will be spread on to, so we
       * should add props one-by-one.
       *
       * On web, these properties are applied to a parent `Pressable`, so this
       * object is empty.
       */
      props: {
        onPress: () => void
        onFocus: () => void
        onBlur: () => void
        onPressIn: () => void
        onPressOut: () => void
        accessibilityLabel: string
      }
    }
  | {
      isNative: false
      control: Dialog.DialogOuterProps['control']
      state: {
        hovered: boolean
        focused: boolean
        /**
         * Native only, `false` on web
         */
        pressed: false
      }
      props: {}
    }

export type ItemProps = React.PropsWithChildren<
  Omit<PressableProps, 'style'> &
    ViewStyleProp & {
      label: string
      onPress: (e: GestureResponderEvent) => void
    }
>

export type ItemTextProps = React.PropsWithChildren<TextStyleProp & {}>
export type ItemIconProps = React.PropsWithChildren<{
  icon: React.ComponentType<SVGIconProps>
  position?: 'left' | 'right'
}>

export type GroupProps = React.PropsWithChildren<ViewStyleProp & {}>

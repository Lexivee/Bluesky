import * as React from 'react'
import {
  Dimensions,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from 'react-native'
import {requireNativeModule, requireNativeViewManager} from 'expo-modules-core'

import {BottomSheetState, BottomSheetViewProps} from './BottomSheet.types'
import {BottomSheetPortalProvider} from './BottomSheetPortal'

const screenHeight = Dimensions.get('screen').height

const NativeView: React.ComponentType<
  BottomSheetViewProps & {
    ref: React.RefObject<any>
    style: StyleProp<ViewStyle>
  }
> = requireNativeViewManager('BottomSheet')

const NativeModule = requireNativeModule('BottomSheet')

export class BottomSheetNativeComponent extends React.Component<
  BottomSheetViewProps,
  {
    open: boolean
  }
> {
  ref = React.createRef<any>()

  constructor(props: BottomSheetViewProps) {
    super(props)
    this.state = {
      open: false,
    }
  }

  present() {
    this.setState({open: true})
  }

  dismiss() {
    this.ref.current?.dismiss()
  }

  private onStateChange = (
    event: NativeSyntheticEvent<{state: BottomSheetState}>,
  ) => {
    const {state} = event.nativeEvent
    const isOpen = state !== 'closed'
    this.setState({open: isOpen})
    this.props.onStateChange?.(event)
  }

  static dismissAll = async () => {
    await NativeModule.dismissAll()
  }

  render() {
    const {children, ...rest} = this.props

    if (!this.state.open) {
      return null
    }

    return (
      <NativeView
        {...rest}
        onStateChange={this.onStateChange}
        ref={this.ref}
        style={{
          position: 'absolute',
          height: screenHeight,
          width: '100%',
        }}>
        <BottomSheetPortalProvider>{children}</BottomSheetPortalProvider>
      </NativeView>
    )
  }
}

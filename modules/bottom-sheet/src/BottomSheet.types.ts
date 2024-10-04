import React from 'react'
import {ColorValue, NativeSyntheticEvent} from 'react-native'

export type BottomSheetState = 'closed' | 'closing' | 'open' | 'opening'

export enum BottomSheetSnapPoint {
  Hidden,
  Partial,
  Full,
}

export type BottomSheetAttemptDismissEvent = NativeSyntheticEvent<object>
export type BottomSheetSnapPointChangeEvent = NativeSyntheticEvent<{
  snapPoint: BottomSheetSnapPoint
}>
export type BottomSheetStateChangeEvent = NativeSyntheticEvent<{
  state: BottomSheetState
}>

export interface BottomSheetViewProps {
  children: React.ReactNode
  cornerRadius?: number
  preventDismiss?: boolean
  preventExpansion?: boolean
  containerBackgroundColor?: ColorValue
  topInset?: number
  bottomInset?: number

  minHeight?: number
  maxHeight?: number

  onAttemptDismiss?: (event: BottomSheetAttemptDismissEvent) => void
  onSnapPointChange?: (event: BottomSheetSnapPointChangeEvent) => void
  onStateChange?: (event: BottomSheetStateChangeEvent) => void
}
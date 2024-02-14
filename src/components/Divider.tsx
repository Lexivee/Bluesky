import React from 'react'
import {View} from 'react-native'
import {atoms as a, useTheme, ViewStyleProp, flatten} from '#/alf'

export function Divider({style}: ViewStyleProp) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.border_t,
        t.atoms.border_contrast_low,
        flatten(style),
      ]}
    />
  )
}

import React from 'react'
import {View} from 'react-native'

import {Message} from '#/screens/Messages/Conversation/RandomClipClops'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function MessageItem({item}: {item: Message}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.py_sm,
        a.px_md,
        a.my_xs,
        a.rounded_md,
        {
          backgroundColor: t.palette.primary_500,
          maxWidth: '65%',
          borderRadius: 17,
        },
      ]}>
      <Text style={[a.text_md, {lineHeight: 1.2, color: 'white'}]}>
        {item.text}
      </Text>
    </View>
  )
}

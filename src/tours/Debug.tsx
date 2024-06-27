import React from 'react'
import {useTourGuideController} from 'rn-tourguide'

import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'

export function TourDebugButton() {
  const {start} = useTourGuideController('home')
  return (
    <Button
      onPress={() => {
        console.log('firing')
        start(1)
      }}>
      {() => <Text>t</Text>}
    </Button>
  )
}

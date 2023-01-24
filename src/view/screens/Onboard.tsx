import React, {useEffect} from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FeatureExplainer} from '../com/onboard/FeatureExplainer'
import {Follows} from '../com/onboard/Follows'
import {OnboardStage, OnboardStageOrder} from '../../state/models/onboard'
import {useStores} from '../../state'

export const Onboard = observer(() => {
  const store = useStores()

  useEffect(() => {
    // sanity check - bounce out of onboarding if the stage is wrong somehow
    if (!OnboardStageOrder.includes(store.onboard.stage)) {
      store.onboard.stop()
    }
  }, [store.onboard])

  let Com
  if (store.onboard.stage === OnboardStage.Explainers) {
    Com = FeatureExplainer
  } else if (store.onboard.stage === OnboardStage.Follows) {
    Com = Follows
  } else {
    Com = View
  }

  return (
    <View style={styles.container}>
      <Com />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: '#fff',
  },
})

import React from 'react'
import {Linking, SafeAreaView, StyleSheet, View} from 'react-native'
import {ScrollView} from './util'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {isPossiblyAUrl} from 'lib/strings/url-helpers'

export const snapPoints = ['50%']

export const Component = observer(function Component({
  text,
  href,
}: {
  text: string
  href: string
}) {
  const pal = usePalette('default')
  const store = useStores()
  const {isMobile} = useWebMediaQueries()

  const onPressVisit = () => {
    store.shell.closeModal()
    Linking.openURL(href)
  }

  return (
    <SafeAreaView style={s.flex1}>
      <ScrollView
        testID="linkWarningModal"
        style={[s.flex1, isMobile && {paddingHorizontal: 18}]}>
        <View style={styles.titleSection}>
          <Text type="title-lg" style={[pal.text, styles.title]}>
            Leaving Bluesky
          </Text>
        </View>

        <View style={{gap: 10}}>
          <Text type="lg" style={pal.text}>
            This link is taking you to the following website:
          </Text>

          <LinkBox href={href} />

          {isPossiblyAUrl(text) && (
            <View
              style={[
                pal.viewLight,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 6,
                  gap: 6,
                },
              ]}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 4,
                }}>
                <FontAwesomeIcon
                  icon="circle-exclamation"
                  color={pal.colors.text}
                  size={14}
                />
                <Text type="lg" style={pal.text}>
                  Which is different than:
                </Text>
              </View>

              <LinkBox href={text} />
            </View>
          )}
        </View>

        <View style={[styles.btnContainer, isMobile && {paddingBottom: 40}]}>
          <Button
            testID="confirmBtn"
            type="primary"
            onPress={onPressVisit}
            accessibilityLabel="Visit Site"
            accessibilityHint=""
            label="Visit Site"
            labelContainerStyle={{justifyContent: 'center', padding: 4}}
            labelStyle={[s.f18]}
          />
          <Button
            testID="cancelBtn"
            type="default"
            onPress={() => store.shell.closeModal()}
            accessibilityLabel="Cancel"
            accessibilityHint=""
            label="Cancel"
            labelContainerStyle={{justifyContent: 'center', padding: 4}}
            labelStyle={[s.f18]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
})

function LinkBox({href}: {href: string}) {
  const pal = usePalette('default')
  const [scheme, hostname, rest] = React.useMemo(() => {
    try {
      const urlp = new URL(href)
      return [
        urlp.protocol + '//',
        urlp.hostname,
        urlp.pathname + urlp.search + urlp.hash,
      ]
    } catch {
      return ['', href, '']
    }
  }, [href])
  return (
    <View style={[pal.view, pal.border, styles.linkBox]}>
      <Text type="lg" style={pal.textLight}>
        {scheme}
        <Text type="lg-bold" style={pal.text}>
          {hostname}
        </Text>
        {rest}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isWeb ? 0 : 40,
  },
  titleSection: {
    paddingTop: isWeb ? 0 : 4,
    paddingBottom: isWeb ? 14 : 10,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  linkBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.blue3,
  },
  btnContainer: {
    paddingTop: 20,
    gap: 6,
  },
})

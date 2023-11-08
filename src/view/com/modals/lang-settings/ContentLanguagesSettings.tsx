import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ScrollView} from '../util'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {deviceLocales} from 'platform/detection'
import {LANGUAGES, LANGUAGES_MAP_CODE2} from '../../../../locale/languages'
import {LanguageToggle} from './LanguageToggle'
import {ConfirmLanguagesButton} from './ConfirmLanguagesButton'
import {useModalControls} from '#/state/modals'
import {
  useLanguagePrefs,
  useSetLanguagePrefs,
} from '#/state/preferences/languages'

export const snapPoints = ['100%']

export function Component({}: {}) {
  const {closeModal} = useModalControls()
  const langPrefs = useLanguagePrefs()
  const setLangPrefs = useSetLanguagePrefs()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const onPressDone = React.useCallback(() => {
    closeModal()
  }, [closeModal])

  const languages = React.useMemo(() => {
    const langs = LANGUAGES.filter(
      lang =>
        !!lang.code2.trim() &&
        LANGUAGES_MAP_CODE2[lang.code2].code3 === lang.code3,
    )
    // sort so that device & selected languages are on top, then alphabetically
    langs.sort((a, b) => {
      const hasA =
        langPrefs.contentLanguages.includes(a.code2) ||
        deviceLocales.includes(a.code2)
      const hasB =
        langPrefs.contentLanguages.includes(b.code2) ||
        deviceLocales.includes(b.code2)
      if (hasA === hasB) return a.name.localeCompare(b.name)
      if (hasA) return -1
      return 1
    })
    return langs
  }, [langPrefs])

  const onPress = React.useCallback(
    (code2: string) => {
      setLangPrefs.toggleContentLanguage(code2)
    },
    [setLangPrefs],
  )

  return (
    <View
      testID="contentLanguagesModal"
      style={[
        pal.view,
        styles.container,
        // @ts-ignore vh is web only
        isMobile
          ? {
              paddingTop: 20,
            }
          : {
              maxHeight: '90vh',
            },
      ]}>
      <Text style={[pal.text, styles.title]}>Content Languages</Text>
      <Text style={[pal.text, styles.description]}>
        Which languages would you like to see in your algorithmic feeds?
      </Text>
      <Text style={[pal.textLight, styles.description]}>
        Leave them all unchecked to see any language.
      </Text>
      <ScrollView style={styles.scrollContainer}>
        {languages.map(lang => (
          <LanguageToggle
            key={lang.code2}
            code2={lang.code2}
            langType="contentLanguages"
            name={lang.name}
            onPress={() => {
              onPress(lang.code2)
            }}
          />
        ))}
        <View
          style={{
            height: isMobile ? 60 : 0,
          }}
        />
      </ScrollView>
      <ConfirmLanguagesButton onPress={onPressDone} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
})

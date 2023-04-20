import React, {useCallback, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {TextInput} from './util'
import {gradients, s} from 'lib/styles'
import {enforceLen} from 'lib/strings/helpers'
import {MAX_ALT_TEXT} from 'lib/constants'
import {useTheme} from 'lib/ThemeContext'
import {Text} from '../util/text/Text'
import {TouchableOpacity} from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from 'state/index'

interface Props {
  onAltTextSet: (altText?: string | undefined) => void
}

export function Component({onAltTextSet}: Props) {
  const pal = usePalette('default')
  const store = useStores()
  const theme = useTheme()
  const [altText, setAltText] = useState('')

  const onPressSave = useCallback(() => {
    onAltTextSet(altText)
    store.shell.closeModal()
  }, [store, altText, onAltTextSet])

  const onPressCancel = () => {
    store.shell.closeModal()
  }

  return (
    <View
      testID="altTextImageModal"
      style={[s.flex1, pal.view, styles.container]}>
      <Text style={[styles.title, pal.text]}>Add alt text</Text>
      <TextInput
        testID="altTextImageInput"
        style={[styles.textArea, pal.border, pal.text]}
        keyboardAppearance={theme.colorScheme}
        multiline
        value={altText}
        onChangeText={text => setAltText(enforceLen(text, MAX_ALT_TEXT))}
      />
      <View style={styles.buttonControls}>
        <TouchableOpacity testID="altTextImageSaveBtn" onPress={onPressSave}>
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.button]}>
            <Text style={[s.white, s.bold]}>Save</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          testID="altTextImageCancelBtn"
          onPress={onPressCancel}>
          <View style={[styles.button]}>
            <Text style={[s.black, s.bold, pal.text]}>Cancel</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 6,
    paddingTop: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 10,
  },
  buttonControls: {
    gap: 8,
  },
})

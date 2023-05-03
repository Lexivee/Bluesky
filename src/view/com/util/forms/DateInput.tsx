import React, {useState, useCallback} from 'react'
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {isIOS, isAndroid} from 'platform/detection'
import {Button} from './Button'
import {Text} from '../text/Text'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'

interface Props {
  testID?: string
  value: Date
  onChange: (date: Date) => void
  buttonType?: string
  buttonStyle?: StyleProp<ViewStyle>
  buttonLabelType?: string
  buttonLabelStyle?: StyleProp<TextStyle>
  accessibilityLabel: string
  accessibilityHint: string
  accessibilityLabelledBy?: string
}

export function DateInput(props: Props) {
  const [show, setShow] = useState(false)
  const theme = useTheme()
  const pal = usePalette('default')

  const onChangeInternal = useCallback(
    (event: DateTimePickerEvent, date: Date) => {
      setShow(false)
      props.onChange(date)
    },
    [setShow, props.onChange],
  )

  const onPress = useCallback(() => {
    setShow(true)
  }, [setShow])

  return (
    <View>
      {isAndroid && (
        <Button
          type={props.buttonType}
          style={props.buttonStyle}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={props.accessibilityLabel}
          accessibilityHint={props.accessibilityHint}
          accessibilityLabelledBy={props.accessibilityLabelledBy}>
          <View style={styles.button}>
            <FontAwesomeIcon
              icon={['far', 'calendar']}
              style={pal.textLight as FontAwesomeIconStyle}
            />
            <Text
              type={props.buttonLabelType}
              style={[pal.text, props.buttonLabelStyle]}>
              {props.value.toLocaleDateString()}
            </Text>
          </View>
        </Button>
      )}
      {(isIOS || show) && (
        <DateTimePicker
          testID={props.testID ? `${props.testID}-datepicker` : undefined}
          mode="date"
          display={isIOS ? 'spinner' : 'calendar'}
          // @ts-ignore applies in iOS only -prf
          themeVariant={theme.colorScheme}
          value={props.value}
          onChange={onChangeInternal}
          accessibilityLabel={props.accessibilityLabel}
          accessibilityHint={props.accessibilityHint}
          accessibilityLabelledBy={props.accessibilityLabelledBy}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
})

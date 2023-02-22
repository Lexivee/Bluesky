import React from 'react'
import {ScrollView, View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {ThemeProvider} from '../lib/ThemeContext'
import {PaletteColorName} from '../lib/ThemeContext'
import {usePalette} from '../lib/hooks/usePalette'
import {s} from '../lib/styles'
import {displayNotification} from '../lib/notifee'

import {Text} from '../com/util/text/Text'
import {ViewSelector} from '../com/util/ViewSelector'
import {EmptyState} from '../com/util/EmptyState'
import * as LoadingPlaceholder from '../com/util/LoadingPlaceholder'
import {Button, ButtonType} from '../com/util/forms/Button'
import {DropdownButton, DropdownItem} from '../com/util/forms/DropdownButton'
import {ToggleButton} from '../com/util/forms/ToggleButton'
import {RadioGroup} from '../com/util/forms/RadioGroup'
import {ErrorScreen} from '../com/util/error/ErrorScreen'
import {ErrorMessage} from '../com/util/error/ErrorMessage'

const MAIN_VIEWS = ['Base', 'Controls', 'Error', 'Notifs']

export const Debug = () => {
  const [colorScheme, setColorScheme] = React.useState<'light' | 'dark'>(
    'light',
  )
  const onToggleColorScheme = () => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light')
  }
  return (
    <ThemeProvider theme={colorScheme}>
      <DebugInner
        colorScheme={colorScheme}
        onToggleColorScheme={onToggleColorScheme}
      />
    </ThemeProvider>
  )
}

function DebugInner({
  colorScheme,
  onToggleColorScheme,
}: {
  colorScheme: 'light' | 'dark'
  onToggleColorScheme: () => void
}) {
  const [currentView, setCurrentView] = React.useState<number>(0)
  const pal = usePalette('default')

  const renderItem = (item: any) => {
    return (
      <View key={`view-${item.currentView}`}>
        <View style={[s.pt10, s.pl10, s.pr10]}>
          <ToggleButton
            type="default-light"
            onPress={onToggleColorScheme}
            isSelected={colorScheme === 'dark'}
            label="Dark mode"
          />
        </View>
        {item.currentView === 3 ? (
          <NotifsView />
        ) : item.currentView === 2 ? (
          <ErrorView />
        ) : item.currentView === 1 ? (
          <ControlsView />
        ) : (
          <BaseView />
        )}
      </View>
    )
  }

  const items = [{currentView}]

  return (
    <View style={[s.h100pct, pal.view]}>
      <ViewHeader title="Debug panel" />
      <ViewSelector
        swipeEnabled
        sections={MAIN_VIEWS}
        items={items}
        renderItem={renderItem}
        onSelectView={setCurrentView}
      />
    </View>
  )
}

function Heading({label}: {label: string}) {
  const pal = usePalette('default')
  return (
    <View style={[s.pt10, s.pb5]}>
      <Text type="title-lg" style={pal.text}>
        {label}
      </Text>
    </View>
  )
}

function BaseView() {
  return (
    <View style={[s.pl10, s.pr10]}>
      <Heading label="Typography" />
      <TypographyView />
      <Heading label="Palettes" />
      <PaletteView palette="default" />
      <PaletteView palette="primary" />
      <PaletteView palette="secondary" />
      <PaletteView palette="inverted" />
      <PaletteView palette="error" />
      <Heading label="Empty state" />
      <EmptyStateView />
      <Heading label="Loading placeholders" />
      <LoadingPlaceholderView />
      <View style={s.footerSpacer} />
    </View>
  )
}

function ControlsView() {
  return (
    <ScrollView style={[s.pl10, s.pr10]}>
      <Heading label="Buttons" />
      <ButtonsView />
      <Heading label="Dropdown Buttons" />
      <DropdownButtonsView />
      <Heading label="Toggle Buttons" />
      <ToggleButtonsView />
      <Heading label="Radio Buttons" />
      <RadioButtonsView />
      <View style={s.footerSpacer} />
    </ScrollView>
  )
}

function ErrorView() {
  return (
    <View style={s.p10}>
      <View style={s.mb5}>
        <ErrorScreen
          title="Error screen"
          message="A major error occurred that led the entire screen to fail"
          details="Here are some details"
          onPressTryAgain={() => {}}
        />
      </View>
      <View style={s.mb5}>
        <ErrorMessage message="This is an error that occurred while things were being done" />
      </View>
      <View style={s.mb5}>
        <ErrorMessage
          message="This is an error that occurred while things were being done"
          numberOfLines={1}
        />
      </View>
      <View style={s.mb5}>
        <ErrorMessage
          message="This is an error that occurred while things were being done"
          onPressTryAgain={() => {}}
        />
      </View>
      <View style={s.mb5}>
        <ErrorMessage
          message="This is an error that occurred while things were being done"
          onPressTryAgain={() => {}}
          numberOfLines={1}
        />
      </View>
    </View>
  )
}

function NotifsView() {
  const trigger = () => {
    displayNotification(
      'Paul Frazee liked your post',
      "Hello world! This is a test of the notifications card. The text is long to see how that's handled.",
    )
  }
  return (
    <View style={s.p10}>
      <View style={s.flexRow}>
        <Button onPress={trigger} label="Trigger" />
      </View>
    </View>
  )
}

function PaletteView({palette}: {palette: PaletteColorName}) {
  const defaultPal = usePalette('default')
  const pal = usePalette(palette)
  return (
    <View style={[pal.view, pal.border, s.p10, s.mb5, s.border1]}>
      <Text style={[pal.text]}>{palette} colors</Text>
      <Text style={[pal.textLight]}>Light text</Text>
      <Text style={[pal.link]}>Link text</Text>
      {palette !== 'default' && (
        <View style={[defaultPal.view]}>
          <Text style={[pal.textInverted]}>Inverted text</Text>
        </View>
      )}
    </View>
  )
}

function TypographyView() {
  const pal = usePalette('default')
  return (
    <View style={[pal.view]}>
      <Text type="xl-thin" style={[pal.text]}>
        'xl-thin' lorem ipsum dolor
      </Text>
      <Text type="xl" style={[pal.text]}>
        'xl' lorem ipsum dolor
      </Text>
      <Text type="xl-medium" style={[pal.text]}>
        'xl-medium' lorem ipsum dolor
      </Text>
      <Text type="xl-bold" style={[pal.text]}>
        'xl-bold' lorem ipsum dolor
      </Text>
      <Text type="xl-heavy" style={[pal.text]}>
        'xl-heavy' lorem ipsum dolor
      </Text>
      <Text type="lg-thin" style={[pal.text]}>
        'lg-thin' lorem ipsum dolor
      </Text>
      <Text type="lg" style={[pal.text]}>
        'lg' lorem ipsum dolor
      </Text>
      <Text type="lg-medium" style={[pal.text]}>
        'lg-medium' lorem ipsum dolor
      </Text>
      <Text type="lg-bold" style={[pal.text]}>
        'lg-bold' lorem ipsum dolor
      </Text>
      <Text type="lg-heavy" style={[pal.text]}>
        'lg-heavy' lorem ipsum dolor
      </Text>
      <Text type="md-thin" style={[pal.text]}>
        'md-thin' lorem ipsum dolor
      </Text>
      <Text type="md" style={[pal.text]}>
        'md' lorem ipsum dolor
      </Text>
      <Text type="md-medium" style={[pal.text]}>
        'md-medium' lorem ipsum dolor
      </Text>
      <Text type="md-bold" style={[pal.text]}>
        'md-bold' lorem ipsum dolor
      </Text>
      <Text type="md-heavy" style={[pal.text]}>
        'md-heavy' lorem ipsum dolor
      </Text>
      <Text type="sm-thin" style={[pal.text]}>
        'sm-thin' lorem ipsum dolor
      </Text>
      <Text type="sm" style={[pal.text]}>
        'sm' lorem ipsum dolor
      </Text>
      <Text type="sm-medium" style={[pal.text]}>
        'sm-medium' lorem ipsum dolor
      </Text>
      <Text type="sm-bold" style={[pal.text]}>
        'sm-bold' lorem ipsum dolor
      </Text>
      <Text type="sm-heavy" style={[pal.text]}>
        'sm-heavy' lorem ipsum dolor
      </Text>
      <Text type="xs-thin" style={[pal.text]}>
        'xs-thin' lorem ipsum dolor
      </Text>
      <Text type="xs" style={[pal.text]}>
        'xs' lorem ipsum dolor
      </Text>
      <Text type="xs-medium" style={[pal.text]}>
        'xs-medium' lorem ipsum dolor
      </Text>
      <Text type="xs-bold" style={[pal.text]}>
        'xs-bold' lorem ipsum dolor
      </Text>
      <Text type="xs-heavy" style={[pal.text]}>
        'xs-heavy' lorem ipsum dolor
      </Text>

      <Text type="title-2xl" style={[pal.text]}>
        'title-2xl' lorem ipsum dolor
      </Text>
      <Text type="title-xl" style={[pal.text]}>
        'title-xl' lorem ipsum dolor
      </Text>
      <Text type="title-lg" style={[pal.text]}>
        'title-lg' lorem ipsum dolor
      </Text>
      <Text type="title" style={[pal.text]}>
        'title' lorem ipsum dolor
      </Text>
      <Text type="button" style={[pal.text]}>
        Button
      </Text>
      <Text type="button-lg" style={[pal.text]}>
        Button-lg
      </Text>
    </View>
  )
}

function EmptyStateView() {
  return <EmptyState icon="bars" message="This is an empty state" />
}

function LoadingPlaceholderView() {
  return (
    <>
      <LoadingPlaceholder.PostLoadingPlaceholder />
      <LoadingPlaceholder.NotificationLoadingPlaceholder />
    </>
  )
}

function ButtonsView() {
  const defaultPal = usePalette('default')
  const buttonStyles = {marginRight: 5}
  return (
    <View style={[defaultPal.view]}>
      <View style={[s.flexRow, s.mb5]}>
        <Button type="primary" label="Primary solid" style={buttonStyles} />
        <Button type="secondary" label="Secondary solid" style={buttonStyles} />
        <Button type="inverted" label="Inverted solid" style={buttonStyles} />
      </View>
      <View style={s.flexRow}>
        <Button
          type="primary-outline"
          label="Primary outline"
          style={buttonStyles}
        />
        <Button
          type="secondary-outline"
          label="Secondary outline"
          style={buttonStyles}
        />
      </View>
      <View style={s.flexRow}>
        <Button
          type="primary-light"
          label="Primary light"
          style={buttonStyles}
        />
        <Button
          type="secondary-light"
          label="Secondary light"
          style={buttonStyles}
        />
      </View>
      <View style={s.flexRow}>
        <Button
          type="default-light"
          label="Default light"
          style={buttonStyles}
        />
      </View>
    </View>
  )
}

const DROPDOWN_ITEMS: DropdownItem[] = [
  {
    icon: ['far', 'paste'],
    label: 'Copy post text',
    onPress() {},
  },
  {
    icon: 'share',
    label: 'Share...',
    onPress() {},
  },
  {
    icon: 'circle-exclamation',
    label: 'Report post',
    onPress() {},
  },
]
function DropdownButtonsView() {
  const defaultPal = usePalette('default')
  return (
    <View style={[defaultPal.view]}>
      <View style={s.mb5}>
        <DropdownButton
          type="primary"
          items={DROPDOWN_ITEMS}
          menuWidth={200}
          label="Primary button"
        />
      </View>
      <View style={s.mb5}>
        <DropdownButton type="bare" items={DROPDOWN_ITEMS} menuWidth={200}>
          <Text>Bare</Text>
        </DropdownButton>
      </View>
    </View>
  )
}

function ToggleButtonsView() {
  const defaultPal = usePalette('default')
  const buttonStyles = s.mb5
  const [isSelected, setIsSelected] = React.useState(false)
  const onToggle = () => setIsSelected(!isSelected)
  return (
    <View style={[defaultPal.view]}>
      <ToggleButton
        type="primary"
        label="Primary solid"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="secondary"
        label="Secondary solid"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="inverted"
        label="Inverted solid"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="primary-outline"
        label="Primary outline"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="secondary-outline"
        label="Secondary outline"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="primary-light"
        label="Primary light"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="secondary-light"
        label="Secondary light"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="default-light"
        label="Default light"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
    </View>
  )
}

const RADIO_BUTTON_ITEMS = [
  {key: 'default-light', label: 'Default Light'},
  {key: 'primary', label: 'Primary'},
  {key: 'secondary', label: 'Secondary'},
  {key: 'inverted', label: 'Inverted'},
  {key: 'primary-outline', label: 'Primary Outline'},
  {key: 'secondary-outline', label: 'Secondary Outline'},
  {key: 'primary-light', label: 'Primary Light'},
  {key: 'secondary-light', label: 'Secondary Light'},
]
function RadioButtonsView() {
  const defaultPal = usePalette('default')
  const [rgType, setRgType] = React.useState<ButtonType>('default-light')
  return (
    <View style={[defaultPal.view]}>
      <RadioGroup
        type={rgType}
        items={RADIO_BUTTON_ITEMS}
        initialSelection="default-light"
        onSelect={v => setRgType(v as ButtonType)}
      />
    </View>
  )
}

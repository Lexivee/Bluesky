import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from '../util/Link'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {CenteredView} from '../util/Views'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

export const SplashScreen = ({
  onPressSignin,
  onPressCreateAccount,
}: {
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const pal = usePalette('default')
  const {isTabletOrMobile} = useWebMediaQueries()
  const styles = useStyles()
  const isMobileWeb = isWeb && isTabletOrMobile

  return (
    <CenteredView style={[styles.container, pal.view]}>
      <View
        testID="noSessionView"
        style={[
          styles.containerInner,
          isMobileWeb && styles.containerInnerMobile,
          pal.border,
        ]}>
        <ErrorBoundary>
          <Text style={isMobileWeb ? styles.titleMobile : styles.title}>
            Bluesky
          </Text>
          <Text style={isMobileWeb ? styles.subtitleMobile : styles.subtitle}>
            See what's next
          </Text>
          <View testID="signinOrCreateAccount" style={styles.btns}>
            <TouchableOpacity
              accessibilityRole="button"
              testID="createAccountButton"
              style={[styles.btn, {backgroundColor: colors.blue3}]}
              onPress={onPressCreateAccount}
              // TODO: web accessibility
              role="button">
              <Text style={[s.white, styles.btnLabel]}>
                Create a new account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              testID="signInButton"
              style={[styles.btn, pal.btn]}
              onPress={onPressSignin}
              // TODO: web accessibility
              role="button">
              <Text style={[pal.text, styles.btnLabel]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ErrorBoundary>
      </View>
      <Footer styles={styles} />
    </CenteredView>
  )
}

function Footer({styles}: {styles: ReturnType<typeof useStyles>}) {
  const pal = usePalette('default')

  return (
    <View style={[styles.footer, pal.view, pal.border]}>
      <TextLink
        href="https://blueskyweb.xyz"
        text="Business"
        style={[styles.footerLink, pal.link]}
      />
      <TextLink
        href="https://blueskyweb.xyz/blog"
        text="Blog"
        style={[styles.footerLink, pal.link]}
      />
      <TextLink
        href="https://blueskyweb.xyz/join"
        text="Jobs"
        style={[styles.footerLink, pal.link]}
      />
    </View>
  )
}
const useStyles = () => {
  const {isTabletOrMobile} = useWebMediaQueries()
  const isMobileWeb = isWeb && isTabletOrMobile
  return StyleSheet.create({
    container: {
      height: '100%',
    },
    containerInner: {
      height: '100%',
      justifyContent: 'center',
      // @ts-ignore web only
      paddingBottom: '20vh',
      paddingHorizontal: 20,
    },
    containerInnerMobile: {
      paddingBottom: 50,
    },
    title: {
      textAlign: 'center',
      color: colors.blue3,
      fontSize: 68,
      fontWeight: 'bold',
      paddingBottom: 10,
    },
    titleMobile: {
      textAlign: 'center',
      color: colors.blue3,
      fontSize: 58,
      fontWeight: 'bold',
    },
    subtitle: {
      textAlign: 'center',
      color: colors.gray5,
      fontSize: 52,
      fontWeight: 'bold',
      paddingBottom: 30,
    },
    subtitleMobile: {
      textAlign: 'center',
      color: colors.gray5,
      fontSize: 42,
      fontWeight: 'bold',
      paddingBottom: 30,
    },
    btns: {
      flexDirection: isMobileWeb ? 'column' : 'row',
      gap: 20,
      justifyContent: 'center',
      paddingBottom: 40,
    },
    btn: {
      borderRadius: 30,
      paddingHorizontal: 24,
      paddingVertical: 12,
      minWidth: 220,
    },
    btnLabel: {
      textAlign: 'center',
      fontSize: 18,
    },
    notice: {
      paddingHorizontal: 40,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 20,
      borderTopWidth: 1,
      flexDirection: 'row',
    },
    footerLink: {
      marginRight: 20,
    },
  })
}

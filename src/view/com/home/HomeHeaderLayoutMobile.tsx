import React, {useState} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  LayoutAnimationConfig,
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated'
import {useSafeAreaFrame} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {useMinimalShellHeaderTransform} from '#/lib/hooks/useMinimalShellTransform'
import {isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'
import {useSetDrawerOpen} from '#/state/shell/drawer-open'
import {useShellLayout} from '#/state/shell/shell-layout'
// import {Logo} from '#/view/icons/Logo'
import {atoms as a, native, useTheme} from '#/alf'
import {Icon, Trigger} from '#/components/dialogs/nuxs/TenMillion/Trigger'
import {useOverscrolled} from '#/components/hooks/useOverscrolled'
import {ColorPalette_Stroke2_Corner0_Rounded as ColorPalette} from '#/components/icons/ColorPalette'
import {Hashtag_Stroke2_Corner0_Rounded as FeedsIcon} from '#/components/icons/Hashtag'
import {Menu_Stroke2_Corner0_Rounded as Menu} from '#/components/icons/Menu'
import {Link} from '#/components/Link'
import {IS_DEV} from '#/env'

export function HomeHeaderLayoutMobile({
  children,
  scrollY,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
  scrollY?: SharedValue<number>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const {headerHeight} = useShellLayout()
  const {height: frameHeight} = useSafeAreaFrame()
  const headerMinimalShellTransform = useMinimalShellHeaderTransform()
  const {hasSession} = useSession()
  const showSpinner = useShowSpinner({scrollY})

  const onPressAvi = React.useCallback(() => {
    setDrawerOpen(true)
  }, [setDrawerOpen])

  // TEMPORARY - REMOVE AFTER MILLY
  // This will just cause the icon to shake a bit when the user first opens the app, drawing attention to the celebration
  // 🎉
  const rotate = useSharedValue(0)
  const reducedMotion = useReducedMotion()

  // Run this a single time on app mount.
  React.useEffect(() => {
    if (reducedMotion) return

    // Waits 1500ms, then rotates 10 degrees with a spring animation. Repeats once.
    rotate.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(10, {duration: 100}),
          withSpring(0, {
            mass: 1,
            damping: 1,
            stiffness: 200,
            overshootClamping: false,
          }),
        ),
        2,
        false,
      ),
    )
  }, [rotate, reducedMotion])

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: isWeb
          ? 0
          : interpolate(
              scrollY?.value ?? -headerHeight.value,
              [-headerHeight.value, 0],
              [headerHeight.value, 0],
              {extrapolateRight: Extrapolation.CLAMP},
            ),
      },
    ],
  }))

  const animatedLogoContainerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: isWeb
          ? 0
          : interpolate(
              scrollY?.value ?? -headerHeight.value,
              [-headerHeight.value, 0],
              [headerHeight.value / 2, 0],
              {extrapolateRight: Extrapolation.CLAMP},
            ),
      },
    ],
  }))

  const animatedJiggleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateZ: `${rotate.value}deg`,
      },
    ],
  }))

  console.log(headerHeight.value)

  return (
    <Animated.View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_medium,
        styles.tabBar,
        headerMinimalShellTransform,
      ]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <View style={[styles.topBar, a.z_10]}>
        <View style={[{width: 100}]}>
          <TouchableOpacity
            testID="viewHeaderDrawerBtn"
            onPress={onPressAvi}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Open navigation`)}
            accessibilityHint={_(
              msg`Access profile and other navigation links`,
            )}
            hitSlop={HITSLOP_10}>
            <Menu size="lg" fill={t.atoms.text_contrast_medium.color} />
          </TouchableOpacity>
        </View>
        <Animated.View style={[animatedLogoContainerStyle]}>
          <LayoutAnimationConfig skipEntering skipExiting>
            {showSpinner ? (
              <Animated.View
                key={1}
                entering={ZoomIn.delay(200)}
                exiting={ZoomOut}
                pointerEvents="none"
                style={[
                  a.absolute,
                  a.inset_0,
                  a.align_center,
                  a.justify_center,
                ]}>
                <ActivityIndicator
                  size="small"
                  color={t.atoms.text_contrast_medium.color}
                />
              </Animated.View>
            ) : (
              <Animated.View
                key={2}
                entering={ZoomIn.delay(300)}
                exiting={ZoomOut}
                style={[
                  a.absolute,
                  a.inset_0,
                  a.align_center,
                  a.justify_center,
                ]}>
                <Animated.View style={[animatedJiggleStyle]}>
                  <Trigger>
                    {ctx => (
                      <Icon
                        width={28}
                        style={{
                          opacity: ctx.pressed ? 0.8 : 1,
                        }}
                      />
                    )}
                  </Trigger>
                </Animated.View>
                {/* <Logo width={30} /> */}
              </Animated.View>
            )}
          </LayoutAnimationConfig>
        </Animated.View>
        <View
          style={[
            a.flex_row,
            a.justify_end,
            a.align_center,
            a.gap_md,
            t.atoms.bg,
            {width: 100},
          ]}>
          {IS_DEV && (
            <>
              <Link label="View storybook" to="/sys/debug">
                <ColorPalette size="md" />
              </Link>
            </>
          )}
          {hasSession && (
            <Link
              testID="viewHeaderHomeFeedPrefsBtn"
              to="/feeds"
              hitSlop={HITSLOP_10}
              label={_(msg`View your feeds and explore more`)}
              size="small"
              variant="ghost"
              color="secondary"
              shape="square"
              style={[
                a.justify_center,
                {
                  marginTop: 2,
                  marginRight: -6,
                },
              ]}>
              <FeedsIcon size="lg" fill={t.atoms.text_contrast_medium.color} />
            </Link>
          )}
        </View>
      </View>
      <Animated.View style={[a.relative, animatedContainerStyle]}>
        {native(
          <View
            style={[
              a.absolute,
              {height: frameHeight},
              {bottom: '100%', left: 0, right: 0},
              t.atoms.bg,
            ]}
          />,
        )}
        {children}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    // @ts-ignore web-only
    position: isWeb ? 'fixed' : 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
    width: '100%',
    minHeight: 46,
  },
  title: {
    fontSize: 21,
  },
})

function useShowSpinner({scrollY}: {scrollY?: SharedValue<number>}) {
  console.log(scrollY?.value)
  const isOverscrolled = useOverscrolled({scrollY, threshold: -15})
  const isSignificantlyOverscrolled = useOverscrolled({scrollY, threshold: -65})
  const [
    hasBeenSignificantlyOverscrolled,
    setHasBeenSignificantlyOverscrolled,
  ] = useState(isSignificantlyOverscrolled)

  if (isSignificantlyOverscrolled && !hasBeenSignificantlyOverscrolled) {
    setHasBeenSignificantlyOverscrolled(true)
  } else if (
    !isOverscrolled &&
    !isSignificantlyOverscrolled &&
    hasBeenSignificantlyOverscrolled
  ) {
    setHasBeenSignificantlyOverscrolled(false)
  }

  return isOverscrolled && hasBeenSignificantlyOverscrolled
}

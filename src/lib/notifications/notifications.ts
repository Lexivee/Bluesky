import React from 'react'
import * as Notifications from 'expo-notifications'

import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import {logEvent, useGate} from 'lib/statsig/statsig'
import {devicePlatform, isNative} from 'platform/detection'

const SERVICE_DID = (serviceUrl?: string) =>
  serviceUrl?.includes('staging')
    ? 'did:web:api.staging.bsky.dev'
    : 'did:web:api.bsky.app'

export function useNotificationsRegistration() {
  const [currentPermissions] = Notifications.usePermissions()
  const {getAgent} = useAgent()
  const {currentAccount} = useSession()

  React.useEffect(() => {
    const registerPushToken = async (token: Notifications.DevicePushToken) => {
      if (!currentAccount) {
        return
      }

      try {
        await getAgent().api.app.bsky.notification.registerPush({
          serviceDid: SERVICE_DID(currentAccount.service),
          platform: devicePlatform,
          token: token.data,
          appId: 'xyz.blueskyweb.app',
        })
        logger.debug(
          'Notifications: Sent push token (change)',
          {
            tokenType: token.type,
            token: token.data,
          },
          logger.DebugContext.notifications,
        )
      } catch (error) {
        logger.error('Notifications: Failed to set push token', {
          message: error,
        })
      }
    }

    // Whenever we all `getDevicePushTokenAsync()`, a change event will be fired below
    if (currentPermissions?.granted) {
      Notifications.getDevicePushTokenAsync()
    }

    // According to the Expo docs, there is a chance that the token will change while the app is open in some rare
    // cases. This will fire `registerPushToken` whenever that happens.
    const subscription = Notifications.addPushTokenListener(async newToken => {
      registerPushToken(newToken)
    })

    return () => {
      subscription.remove()
    }
  }, [currentAccount, currentPermissions, getAgent])
}

export function useRequestNotificationsPermission() {
  const gate = useGate()
  const [currentPermissions] = Notifications.usePermissions()

  return React.useCallback(
    async (context: 'StartOnboarding' | 'AfterOnboarding') => {
      if (
        !isNative ||
        currentPermissions?.status === 'granted' ||
        (currentPermissions?.status === 'denied' &&
          !currentPermissions?.canAskAgain)
      ) {
        return
      }
      if (
        context === 'StartOnboarding' &&
        gate('request_notifications_permission_after_onboarding')
      ) {
        return
      }
      if (
        context === 'AfterOnboarding' &&
        !gate('request_notifications_permission_after_onboarding')
      ) {
        return
      }

      const res = await Notifications.requestPermissionsAsync()
      logEvent('notifications:request', {
        status: res.status,
      })
    },
    [currentPermissions?.canAskAgain, currentPermissions?.status, gate],
  )
}

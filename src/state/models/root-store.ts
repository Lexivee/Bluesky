/**
 * The root store is the base of all modeled state.
 */

import {makeAutoObservable} from 'mobx'
import {AtpAgent} from '@atproto/api'
import {createContext, useContext} from 'react'
import {DeviceEventEmitter, EmitterSubscription} from 'react-native'
import BackgroundFetch from 'react-native-background-fetch'
import {z} from 'zod'
import {isObj, hasProp} from '../lib/type-guards'
import {LogModel} from './log'
import {SessionModel} from './session'
import {NavigationModel} from './navigation'
import {ShellUiModel} from './shell-ui'
import {ProfilesViewModel} from './profiles-view'
import {LinkMetasViewModel} from './link-metas-view'
import {MeModel} from './me'
import {OnboardModel} from './onboard'

export const appInfo = z.object({
  build: z.string(),
  name: z.string(),
  namespace: z.string(),
  version: z.string(),
})
export type AppInfo = z.infer<typeof appInfo>

export class RootStoreModel {
  agent: AtpAgent
  appInfo?: AppInfo
  log = new LogModel()
  session = new SessionModel(this)
  nav = new NavigationModel(this)
  shell = new ShellUiModel(this)
  me = new MeModel(this)
  onboard = new OnboardModel()
  profiles = new ProfilesViewModel(this)
  linkMetas = new LinkMetasViewModel(this)

  constructor(agent: AtpAgent) {
    this.agent = agent
    makeAutoObservable(this, {
      api: false,
      serialize: false,
      hydrate: false,
    })
    this.initBgFetch()
  }

  get api() {
    return this.agent.api
  }

  setAppInfo(info: AppInfo) {
    this.appInfo = info
  }

  serialize(): unknown {
    return {
      appInfo: this.appInfo,
      log: this.log.serialize(),
      session: this.session.serialize(),
      me: this.me.serialize(),
      nav: this.nav.serialize(),
      onboard: this.onboard.serialize(),
      shell: this.shell.serialize(),
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'appInfo')) {
        const appInfoParsed = appInfo.safeParse(v.appInfo)
        if (appInfoParsed.success) {
          this.setAppInfo(appInfoParsed.data)
        }
      }
      if (hasProp(v, 'log')) {
        this.log.hydrate(v.log)
      }
      if (hasProp(v, 'me')) {
        this.me.hydrate(v.me)
      }
      if (hasProp(v, 'nav')) {
        this.nav.hydrate(v.nav)
      }
      if (hasProp(v, 'onboard')) {
        this.onboard.hydrate(v.onboard)
      }
      if (hasProp(v, 'session')) {
        this.session.hydrate(v.session)
      }
      if (hasProp(v, 'shell')) {
        this.shell.hydrate(v.shell)
      }
    }
  }

  /**
   * Called during init to resume any stored session.
   */
  async attemptSessionResumption() {
    this.log.debug('RootStoreModel:attemptSessionResumption')
    try {
      await this.session.attemptSessionResumption()
      this.log.debug('Session initialized', {
        hasSession: this.session.hasSession,
      })
      this.updateSessionState()
    } catch (e: any) {
      this.log.warn('Failed to initialize session', e)
    }
  }

  /**
   * Called by the session model. Refreshes session-oriented state.
   */
  async handleSessionChange(agent: AtpAgent) {
    this.log.debug('RootStoreModel:handleSessionChange')
    this.agent = agent
    this.nav.clear()
    this.me.clear()
    await this.me.load()
  }

  /**
   * Called by the session model. Handles session drops by informing the user.
   */
  async handleSessionDrop() {
    this.log.debug('RootStoreModel:handleSessionDrop')
    this.nav.clear()
    this.me.clear()
    this.emitSessionDropped()
  }

  /**
   * Clears all session-oriented state.
   */
  clearAllSessionState() {
    this.log.debug('RootStoreModel:clearAllSessionState')
    this.session.clear()
    this.nav.clear()
    this.me.clear()
  }

  /**
   * Periodic poll for new session state.
   */
  async updateSessionState() {
    if (!this.session.hasSession) {
      return
    }
    try {
      await this.me.fetchNotifications()
      await this.me.follows.fetchIfNeeded()
    } catch (e: any) {
      this.log.error('Failed to fetch latest state', e)
    }
  }

  // global event bus
  // =
  // - some events need to be passed around between views and models
  //   in order to keep state in sync; these methods are for that

  onPostDeleted(handler: (uri: string) => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('post-deleted', handler)
  }

  emitPostDeleted(uri: string) {
    DeviceEventEmitter.emit('post-deleted', uri)
  }

  onSessionDropped(handler: () => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('session-dropped', handler)
  }

  emitSessionDropped() {
    DeviceEventEmitter.emit('session-dropped')
  }

  onNavigation(handler: () => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('navigation', handler)
  }

  emitNavigation() {
    DeviceEventEmitter.emit('navigation')
  }

  // a "soft reset" typically means scrolling to top and loading latest
  // but it can depend on the screen
  onScreenSoftReset(handler: () => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('screen-soft-reset', handler)
  }

  emitScreenSoftReset() {
    DeviceEventEmitter.emit('screen-soft-reset')
  }

  // background fetch
  // =
  // - we use this to poll for unread notifications, which is not "ideal" behavior but
  //   gives us a solution for push-notifications that work against any pds

  initBgFetch() {
    // NOTE
    // background fetch runs every 15 minutes *at most* and will get slowed down
    // based on some heuristics run by iOS, meaning it is not a reliable form of delivery
    // -prf
    BackgroundFetch.configure(
      {minimumFetchInterval: 15},
      this.onBgFetch.bind(this),
      this.onBgFetchTimeout.bind(this),
    ).then(status => {
      this.log.debug(`Background fetch initiated, status: ${status}`)
    })
  }

  async onBgFetch(taskId: string) {
    this.log.debug(`Background fetch fired for task ${taskId}`)
    if (this.session.hasSession) {
      await this.me.bgFetchNotifications()
    }
    BackgroundFetch.finish(taskId)
  }

  onBgFetchTimeout(taskId: string) {
    this.log.debug(`Background fetch timed out for task ${taskId}`)
    BackgroundFetch.finish(taskId)
  }
}

const throwawayInst = new RootStoreModel(
  new AtpAgent({service: 'http://localhost'}),
) // this will be replaced by the loader, we just need to supply a value at init
const RootStoreContext = createContext<RootStoreModel>(throwawayInst)
export const RootStoreProvider = RootStoreContext.Provider
export const useStores = () => useContext(RootStoreContext)

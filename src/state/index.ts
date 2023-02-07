import {autorun} from 'mobx'
import {Platform} from 'react-native'
import {AtpAgent} from '@atproto/api'
import {RootStoreModel} from './models/root-store'
import * as libapi from './lib/api'
import * as storage from './lib/storage'

export const LOCAL_DEV_SERVICE =
  Platform.OS === 'ios' ? 'http://localhost:2583' : 'http://10.0.2.2:2583'
export const STAGING_SERVICE = 'https://pds.staging.bsky.dev'
export const PROD_SERVICE = 'https://bsky.social'
export const DEFAULT_SERVICE = PROD_SERVICE
const ROOT_STATE_STORAGE_KEY = 'root'
const STATE_FETCH_INTERVAL = 15e3

export async function setupState(serviceUri = DEFAULT_SERVICE) {
  let rootStore: RootStoreModel
  let data: any

  libapi.doPolyfill()

  rootStore = new RootStoreModel(new AtpAgent({service: serviceUri}))
  try {
    data = (await storage.load(ROOT_STATE_STORAGE_KEY)) || {}
    rootStore.log.debug('Initial hydrate', {hasSession: !!data.session})
    rootStore.hydrate(data)
  } catch (e: any) {
    rootStore.log.error('Failed to load state from storage', e)
  }
  rootStore.attemptSessionResumption()

  // track changes & save to storage
  autorun(() => {
    const snapshot = rootStore.serialize()
    storage.save(ROOT_STATE_STORAGE_KEY, snapshot)
  })

  // periodic state fetch
  setInterval(() => {
    rootStore.updateSessionState()
  }, STATE_FETCH_INTERVAL)

  return rootStore
}

export {useStores, RootStoreModel, RootStoreProvider} from './models/root-store'

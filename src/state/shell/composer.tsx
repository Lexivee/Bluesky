import React from 'react'
import {AppBskyEmbedRecord} from '@atproto/api'

export interface ComposerOptsPostRef {
  uri: string
  cid: string
  text: string
  author: {
    handle: string
    displayName?: string
    avatar?: string
  }
}
export interface ComposerOptsQuote {
  uri: string
  cid: string
  text: string
  indexedAt: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  embeds?: AppBskyEmbedRecord.ViewRecord['embeds']
}
export interface ComposerOpts {
  replyTo?: ComposerOptsPostRef
  onPost?: () => void
  quote?: ComposerOptsQuote
  mention?: string // handle of user to mention
}

type StateContext = ComposerOpts | undefined
type ControlsContext = {
  openComposer: (opts: ComposerOpts) => void
  closeComposer: () => boolean
}

const stateContext = React.createContext<StateContext>(undefined)
const controlsContext = React.createContext<ControlsContext>({
  openComposer(_opts: ComposerOpts) {},
  closeComposer() {
    return false
  },
})

/**
 * @deprecated DO NOT USE THIS unless you have no other choice.
 */
export let unstable__closeComposer: () => boolean = () => {
  throw new Error(`ComposerContext is not initialized`)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<StateContext>()
  const api = React.useMemo(
    () => ({
      openComposer(opts: ComposerOpts) {
        setState(opts)
      },
      closeComposer() {
        let wasOpen = false
        setState(v => {
          wasOpen = !!v
          return undefined
        })
        return wasOpen
      },
    }),
    [setState],
  )

  unstable__closeComposer = api.closeComposer

  return (
    <stateContext.Provider value={state}>
      <controlsContext.Provider value={api}>
        {children}
      </controlsContext.Provider>
    </stateContext.Provider>
  )
}

export function useComposerState() {
  return React.useContext(stateContext)
}

export function useComposerControls() {
  return React.useContext(controlsContext)
}

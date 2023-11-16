import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'

interface Lightbox {
  name: string
}

export class ProfileImageLightbox implements Lightbox {
  name = 'profile-image'
  constructor(public profile: AppBskyActorDefs.ProfileViewDetailed) {}
}

interface ImagesLightboxItem {
  uri: string
  alt?: string
}

export class ImagesLightbox implements Lightbox {
  name = 'images'
  constructor(public images: ImagesLightboxItem[], public index: number) {}
  setIndex(index: number) {
    this.index = index
  }
}

const LightboxContext = React.createContext<{
  activeLightbox: Lightbox | null
}>({
  activeLightbox: null,
})

const LightboxControlContext = React.createContext<{
  openLightbox: (lightbox: Lightbox) => void
  closeLightbox: () => void
}>({
  openLightbox: () => {},
  closeLightbox: () => {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [activeLightbox, setActiveLightbox] = React.useState<Lightbox | null>(
    null,
  )

  const openLightbox = React.useCallback(
    (lightbox: Lightbox) => {
      setActiveLightbox(lightbox)
    },
    [setActiveLightbox],
  )

  const closeLightbox = React.useCallback(() => {
    setActiveLightbox(null)
  }, [setActiveLightbox])

  const state = React.useMemo(
    () => ({
      activeLightbox,
    }),
    [activeLightbox],
  )

  const methods = React.useMemo(
    () => ({
      openLightbox,
      closeLightbox,
    }),
    [openLightbox, closeLightbox],
  )

  return (
    <LightboxContext.Provider value={state}>
      <LightboxControlContext.Provider value={methods}>
        {children}
      </LightboxControlContext.Provider>
    </LightboxContext.Provider>
  )
}

export function useLightbox() {
  return React.useContext(LightboxContext)
}

export function useLightboxControls() {
  return React.useContext(LightboxControlContext)
}

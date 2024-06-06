import {createContext, PropsWithChildren, useContext, useState} from 'react'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(false)
const setContext = createContext<SetContext>((_: boolean) => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(false)

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useIsDrawerOpen() {
  return useContext(stateContext)
}

export function useSetDrawerOpen() {
  return useContext(setContext)
}

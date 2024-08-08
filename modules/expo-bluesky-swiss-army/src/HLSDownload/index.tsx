import React from 'react'

import {NotImplementedError} from '../NotImplemented'
import {HLSDownloadViewProps} from './types'

export default class HLSDownloadView extends React.PureComponent<HLSDownloadViewProps> {
  constructor(props: HLSDownloadViewProps) {
    super(props)
  }

  isAvailable(): boolean {
    return false
  }

  async startDownloadAsync(sourceUrl: string): Promise<void> {
    throw new NotImplementedError({sourceUrl})
  }

  async cancelAsync(sourceUrl: string): Promise<void> {
    throw new NotImplementedError({sourceUrl})
  }

  render() {
    return null
  }
}

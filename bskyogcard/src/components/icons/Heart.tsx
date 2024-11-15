import React from 'react'

import {IconProps} from './types.js'

export function Heart({size, fill}: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill={fill}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.489 21.372c8.528-4.78 10.626-10.47 9.022-14.47-.779-1.941-2.414-3.333-4.342-3.763-1.697-.378-3.552.003-5.169 1.287-1.617-1.284-3.472-1.665-5.17-1.287-1.927.43-3.562 1.822-4.34 3.764-1.605 4 .493 9.69 9.021 14.47a1 1 0 0 0 .978 0Z"
      />
    </svg>
  )
}

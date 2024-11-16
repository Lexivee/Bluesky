import type {I18n} from '@lingui/core'

export const formatCount = (i18n: I18n, num: number) => {
  let truncatedNum
  const options: Intl.NumberFormatOptions = {
    notation: 'compact',
    maximumFractionDigits: 1,
  }

  // `1,953` shouldn't be rounded up to 2k, it should be truncated.
  if (num >= 1e12) {
    truncatedNum = Math.floor(num / 1e11) * 1e11
  } else if (num >= 1e9) {
    truncatedNum = Math.floor(num / 1e8) * 1e8
  } else if (num >= 1e6) {
    truncatedNum = Math.floor(num / 1e5) * 1e5
  } else if (num >= 1e3) {
    truncatedNum = Math.floor(num / 1e2) * 1e2
  } else {
    truncatedNum = num
  }

  return i18n.number(truncatedNum, options)
}

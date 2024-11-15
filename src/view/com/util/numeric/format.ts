import type {I18n} from '@lingui/core'

export const formatCount = (i18n: I18n, num: number) => {
  const options: Intl.NumberFormatOptions = {
    notation: 'compact',
    maximumFractionDigits: 1,
  }

  // `1,953` shouldn't be rounded up to 2k, it should be truncated.
  if ('roundingMode' in Intl.NumberFormat.prototype) {
    options.roundingMode = 'trunc'
  } else {
    // if 'roundingMode' is not supported in the current runtime, fall back to manual truncation
    if (num >= 1e9) {
      num = Math.floor(num / 1e8) * 1e8
    } else if (num >= 1e6) {
      num = Math.floor(num / 1e5) * 1e5
    } else if (num >= 1000) {
      num = Math.floor(num / 1e2) * 1e2
    }
  }

  return i18n.number(num, options)
}

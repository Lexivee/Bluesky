import {
  Dimensions,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native'
import {Theme, TypographyVariant} from './ThemeContext'
import {isMobileWeb} from 'platform/detection'

// 1 is lightest, 2 is light, 3 is mid, 4 is dark, 5 is darkest
export const colors = {
  white: '#ffffff',
  black: '#000000',

  gray1: '#F3F3F8',
  gray2: '#E2E2E4',
  gray3: '#C9C9CC',
  gray4: '#8D8E96',
  gray5: '#545664',
  gray6: '#373942',
  gray7: '#26272D',
  gray8: '#141417',

  blue0: '#bfe1ff',
  blue1: '#8bc7fd',
  blue2: '#52acfe',
  blue3: '#0085ff',
  blue4: '#0062bd',
  blue5: '#034581',
  blue6: '#012561',
  blue7: '#001040',

  red1: '#ffe6f2',
  red2: '#fba2ce',
  red3: '#ec4899',
  red4: '#d1106f',
  red5: '#97074e',
  red6: '#690436',
  red7: '#4F0328',

  pink1: '#f8ccff',
  pink2: '#e966ff',
  pink3: '#db00ff',
  pink4: '#a601c1',
  pink5: '#570066',

  purple1: '#ebdbff',
  purple2: '#ba85ff',
  purple3: '#9747ff',
  purple4: '#6d00fa',
  purple5: '#380080',

  green1: '#c1ffb8',
  green2: '#27f406',
  green3: '#20bc07',
  green4: '#148203',
  green5: '#082b03',

  lilac1: '#f8ecfd',
  lilac2: '#f2dffb',
  lilac3: '#e5bef7',
  lilac4: '#b03ae7',
  lilac5: '#7723ab',
  lilac6: '#4d117f',
  lilac7: '#230053',

  waverly1: '#3D00BD', // Dark pruple, e.g for the FAB
  waverly2: '#5924C8',
  waverly3: '#C9B6F2',
  waverly4: '#E0D6F4',
  waverly5: '#ECE3FF',

  unreadNotifBg: '#ebf6ff',
  brandBlue: '#0066FF',
  like: '#ec4899',
}

export const gradients = {
  blueLight: {start: '#5A71FA', end: colors.blue3}, // buttons
  blue: {start: '#5E55FB', end: colors.blue3}, // fab
  blueDark: {start: '#5F45E0', end: colors.blue3}, // avis, banner
  waverlyDark: {start: colors.waverly1, end: colors.waverly2},
}

export const s = StyleSheet.create({
  // helpers
  footerSpacer: {height: 100},
  contentContainer: {paddingBottom: 200},
  contentContainerExtra: {paddingBottom: 300},
  border0: {borderWidth: 0},
  border1: {borderWidth: 1},
  border2: {borderWidth: 2},
  borderTop1: {borderTopWidth: 1},
  borderRight1: {borderRightWidth: 1},
  borderBottom1: {borderBottomWidth: 1},
  borderLeft1: {borderLeftWidth: 1},
  hidden: {display: 'none'},
  dimmed: {opacity: 0.5},

  // font weights
  fw600: {fontWeight: '600'},
  bold: {fontWeight: 'bold'},
  fw500: {fontWeight: '500'},
  semiBold: {fontWeight: '500'},
  fw400: {fontWeight: '400'},
  normal: {fontWeight: '400'},
  fw300: {fontWeight: '300'},
  light: {fontWeight: '300'},
  fw200: {fontWeight: '200'},

  // text decoration
  underline: {textDecorationLine: 'underline'},

  // font variants
  tabularNum: {fontVariant: ['tabular-nums']},

  // font sizes
  f9: {fontSize: 9},
  f10: {fontSize: 10},
  f11: {fontSize: 11},
  f12: {fontSize: 12},
  f13: {fontSize: 13},
  f14: {fontSize: 14},
  f15: {fontSize: 15},
  f16: {fontSize: 16},
  f17: {fontSize: 17},
  f18: {fontSize: 18},

  // line heights
  ['lh13-1']: {lineHeight: 13},
  ['lh13-1.3']: {lineHeight: 16.9}, // 1.3 of 13px
  ['lh14-1']: {lineHeight: 14},
  ['lh14-1.3']: {lineHeight: 18.2}, // 1.3 of 14px
  ['lh15-1']: {lineHeight: 15},
  ['lh15-1.3']: {lineHeight: 19.5}, // 1.3 of 15px
  ['lh16-1']: {lineHeight: 16},
  ['lh16-1.3']: {lineHeight: 20.8}, // 1.3 of 16px
  ['lh17-1']: {lineHeight: 17},
  ['lh17-1.3']: {lineHeight: 22.1}, // 1.3 of 17px
  ['lh18-1']: {lineHeight: 18},
  ['lh18-1.3']: {lineHeight: 23.4}, // 1.3 of 18px

  // margins
  mr2: {marginRight: 2},
  mr5: {marginRight: 5},
  mr10: {marginRight: 10},
  mr20: {marginRight: 20},
  ml2: {marginLeft: 2},
  ml5: {marginLeft: 5},
  ml10: {marginLeft: 10},
  ml20: {marginLeft: 20},
  mt2: {marginTop: 2},
  mt5: {marginTop: 5},
  mt10: {marginTop: 10},
  mt20: {marginTop: 20},
  mb2: {marginBottom: 2},
  mb5: {marginBottom: 5},
  mb10: {marginBottom: 10},
  mb20: {marginBottom: 20},

  // paddings
  p2: {padding: 2},
  p5: {padding: 5},
  p10: {padding: 10},
  p20: {padding: 20},
  pr2: {paddingRight: 2},
  pr5: {paddingRight: 5},
  pr10: {paddingRight: 10},
  pr20: {paddingRight: 20},
  pl2: {paddingLeft: 2},
  pl5: {paddingLeft: 5},
  pl10: {paddingLeft: 10},
  pl20: {paddingLeft: 20},
  pt2: {paddingTop: 2},
  pt5: {paddingTop: 5},
  pt10: {paddingTop: 10},
  pt20: {paddingTop: 20},
  pb2: {paddingBottom: 2},
  pb5: {paddingBottom: 5},
  pb10: {paddingBottom: 10},
  pb20: {paddingBottom: 20},
  px5: {paddingHorizontal: 5},

  // gaps
  g2: {gap: 2},
  g5: {gap: 5},
  g10: {gap: 10},
  g15: {gap: 15},
  g20: {gap: 20},

  // opacity
  op0: {opacity: 0},
  op10: {opacity: 0.1},
  op20: {opacity: 0.2},
  op30: {opacity: 0.3},
  op40: {opacity: 0.4},
  op50: {opacity: 0.5},
  op60: {opacity: 0.6},
  op70: {opacity: 0.7},
  op80: {opacity: 0.8},
  op90: {opacity: 0.9},
  op100: {opacity: 1},

  // flex
  flexRow: {flexDirection: 'row'},
  flexCol: {flexDirection: 'column'},
  flex1: {flex: 1},
  alignCenter: {alignItems: 'center'},
  alignBaseline: {alignItems: 'baseline'},

  // position
  absolute: {position: 'absolute'},

  // dimensions
  w100pct: {width: '100%'},
  h100pct: {height: '100%'},
  hContentRegion: isMobileWeb ? {flex: 1} : {height: '100%'},
  window: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },

  // text align
  textLeft: {textAlign: 'left'},
  textCenter: {textAlign: 'center'},
  textRight: {textAlign: 'right'},

  // colors
  white: {color: colors.white},
  black: {color: colors.black},

  gray1: {color: colors.gray1},
  gray2: {color: colors.gray2},
  gray3: {color: colors.gray3},
  gray4: {color: colors.gray4},
  gray5: {color: colors.gray5},

  blue1: {color: colors.blue1},
  blue2: {color: colors.blue2},
  blue3: {color: colors.blue3},
  blue4: {color: colors.blue4},
  blue5: {color: colors.blue5},

  red1: {color: colors.red1},
  red2: {color: colors.red2},
  red3: {color: colors.red3},
  red4: {color: colors.red4},
  red5: {color: colors.red5},

  pink1: {color: colors.pink1},
  pink2: {color: colors.pink2},
  pink3: {color: colors.pink3},
  pink4: {color: colors.pink4},
  pink5: {color: colors.pink5},

  purple1: {color: colors.purple1},
  purple2: {color: colors.purple2},
  purple3: {color: colors.purple3},
  purple4: {color: colors.purple4},
  purple5: {color: colors.purple5},

  green1: {color: colors.green1},
  green2: {color: colors.green2},
  green3: {color: colors.green3},
  green4: {color: colors.green4},
  green5: {color: colors.green5},

  lilac1: {color: colors.lilac1},
  lilac2: {color: colors.lilac2},
  lilac4: {color: colors.lilac4},
  lilac5: {color: colors.lilac5},
  lilac7: {color: colors.lilac7},

  brandBlue: {color: colors.brandBlue},
  likeColor: {color: colors.like},

  waverly1: {color: colors.waverly1},
  waverly2: {color: colors.waverly2},
  waverly3: {color: colors.waverly3},
  waverly4: {color: colors.waverly4},
  waverly5: {color: colors.waverly5},
})

export function lh(
  theme: Theme,
  type: TypographyVariant,
  height: number,
): TextStyle {
  return {
    lineHeight: (theme.typography[type].fontSize || 16) * height,
  }
}

export function addStyle<T>(
  base: StyleProp<T>,
  addedStyle: StyleProp<T>,
): StyleProp<T> {
  if (Array.isArray(base)) {
    return base.concat([addedStyle])
  }
  return [base, addedStyle]
}

export function alpha(color: string, a: number): string {
  const aHex = Math.floor(a * 255).toString(16)
  return color + (aHex.length === 1 ? '0' : '') + aHex
}

export function alphaBg(style: ViewStyle, a: number): ViewStyle {
  const bg = style.backgroundColor
  if (!bg || typeof bg !== 'string') return style
  return {...style, backgroundColor: alpha(bg, a)}
}

import {useMediaQuery} from 'react-responsive'
import {isNative} from 'platform/detection'

export function useWebMediaQueries() {
  const isDesktop = useMediaQuery({minWidth: 1300})
  const isTablet = useMediaQuery({minWidth: 800, maxWidth: 1299})
  const isMobile = useMediaQuery({maxWidth: 799})
  const isTabletOrMobile = isMobile || isTablet
  const isTabletOrDesktop = isDesktop || isTablet
  if (isNative) {
    return {
      isMobile: true,
      isTablet: false,
      isTabletOrMobile: true,
      isTabletOrDesktop: false,
      isDesktop: false,
    }
  }
  return {isMobile, isTablet, isTabletOrMobile, isTabletOrDesktop, isDesktop}
}

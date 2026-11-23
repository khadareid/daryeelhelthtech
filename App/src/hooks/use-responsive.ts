import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Breakpoints aligned with the Website Tailwind sm/md/lg scale. */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isPhone = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const isDesktop = width >= 1024;
    const columns = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
    const exploreColumns = width >= 900 ? 3 : 2;
    const cardWidth =
      columns === 1
        ? width - 32
        : (width - 32 - (columns - 1) * 10) / columns;
    const heroHeight = Math.min(240, Math.max(150, Math.round(width * 0.42)));

    return {
      width,
      height,
      isPhone,
      isTablet,
      isDesktop,
      columns,
      exploreColumns,
      cardWidth,
      heroHeight,
      gap: isPhone ? 8 : 12,
      pad: isPhone ? 12 : 16,
      titleSize: isPhone ? 20 : isTablet ? 24 : 28,
      bodySize: isPhone ? 13 : 14,
    };
  }, [width, height]);
}

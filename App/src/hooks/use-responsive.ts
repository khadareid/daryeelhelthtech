import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

/** Breakpoints aligned with the Website Tailwind sm/md/lg scale. */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const pagePad = Spacing.three * 2;
    const contentWidth = Math.min(Math.max(width - pagePad, 280), MaxContentWidth);
    const isPhone = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const isDesktop = width >= 1024;
    const columns = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
    /** Dense grids (team, values, CMS cards) — 2 cols from ~large phone up. */
    const gridColumns = width >= 1024 ? 3 : width >= 380 ? 2 : 1;
    const exploreColumns = width >= 900 ? 3 : 2;
    const gap = isPhone ? 8 : 12;
    const cardWidth =
      columns === 1
        ? contentWidth
        : (contentWidth - gap * (columns - 1)) / columns;
    const gridCardWidth =
      gridColumns === 1
        ? contentWidth
        : (contentWidth - gap * (gridColumns - 1)) / gridColumns;
    const heroHeight = Math.min(240, Math.max(150, Math.round(contentWidth * 0.42)));

    return {
      width,
      height,
      contentWidth,
      isPhone,
      isTablet,
      isDesktop,
      columns,
      gridColumns,
      exploreColumns,
      cardWidth,
      gridCardWidth,
      heroHeight,
      gap,
      pad: isPhone ? 12 : 16,
      titleSize: isPhone ? 20 : isTablet ? 24 : 28,
      bodySize: isPhone ? 13 : 14,
    };
  }, [width, height]);
}

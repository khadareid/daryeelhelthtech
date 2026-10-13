import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';

type BoneProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBone({
  width = '100%',
  height = 14,
  radius = Radius.sm,
  style,
}: BoneProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: Brand.light,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Full-screen app bootstrap skeleton (auth gate / tabs loading). */
export function AppLoadingSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonBone width={40} height={40} radius={12} />
          <View style={styles.headerText}>
            <SkeletonBone width={120} height={16} />
            <SkeletonBone width={80} height={12} />
          </View>
        </View>
        <View style={styles.headerActions}>
          <SkeletonBone width={40} height={40} radius={20} />
          <SkeletonBone width={40} height={40} radius={20} />
        </View>
      </View>

      <SkeletonBone width="100%" height={48} radius={Radius.full} />

      <View style={styles.grid}>
        <SkeletonBone width="48%" height={78} radius={Radius.lg} />
        <SkeletonBone width="48%" height={78} radius={Radius.lg} />
        <SkeletonBone width="48%" height={78} radius={Radius.lg} />
        <SkeletonBone width="48%" height={78} radius={Radius.lg} />
      </View>

      <SkeletonBone width="100%" height={120} radius={Radius.xl} />
      <SkeletonBone width={160} height={18} />
      <SkeletonBone width="100%" height={88} radius={Radius.lg} />
      <SkeletonBone width="100%" height={88} radius={Radius.lg} />
    </View>
  );
}

/** Compact list skeleton for screen pull/refresh placeholders. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.rowCard}>
          <SkeletonBone width={64} height={64} radius={Radius.md} />
          <View style={styles.rowCopy}>
            <SkeletonBone width="70%" height={14} />
            <SkeletonBone width="45%" height={12} />
            <SkeletonBone width="55%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    flex: 1,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.two,
  },
  list: {
    gap: Spacing.three,
  },
  rowCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 8,
  },
});

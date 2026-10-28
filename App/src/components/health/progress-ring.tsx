import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';

type Props = {
  size?: number;
  stroke?: number;
  progress: number;
  trackColor?: string;
  tintColor?: string;
  label?: string;
  value: string;
  valueColor?: string;
  labelColor?: string;
  icon?: React.ReactNode;
};

/** Soft circular progress without extra SVG deps (Health-style ring). */
export function ProgressRing({
  size = 140,
  stroke = 12,
  progress,
  trackColor = 'rgba(255,255,255,0.28)',
  tintColor = '#FFFFFF',
  label,
  value,
  valueColor = '#FFFFFF',
  labelColor = 'rgba(255,255,255,0.85)',
  icon,
}: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  const inner = size - stroke * 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: trackColor,
          },
        ]}
      />
      {/* Simple arc approximation via 4 quadrant caps */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { alignItems: 'center', justifyContent: 'center' },
        ]}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: 'transparent',
            borderTopColor: pct > 0.02 ? tintColor : 'transparent',
            borderRightColor: pct > 0.25 ? tintColor : 'transparent',
            borderBottomColor: pct > 0.5 ? tintColor : 'transparent',
            borderLeftColor: pct > 0.75 ? tintColor : 'transparent',
            transform: [{ rotate: `${-90 + pct * 360}deg` }],
          }}
        />
      </View>
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}>
        {icon}
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        {label ? (
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
  },
  value: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
});

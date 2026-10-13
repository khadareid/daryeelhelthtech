import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DoctorItem } from '@/constants/content';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  doctor: DoctorItem;
  onPress?: () => void;
};

export function DoctorListCard({ doctor, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <Image source={doctor.image} style={styles.avatar} contentFit="cover" />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, { color: theme.brandDark }]}
            numberOfLines={1}>
            {doctor.name}
          </Text>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>★ {doctor.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={[styles.specialty, { color: theme.primary }]}>
          {doctor.specialty}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {doctor.experienceYears}+ yrs · {doctor.hospitalName}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {doctor.city} · {doctor.reviews} reviews
        </Text>
        <View style={styles.bottomRow}>
          <Text style={[styles.fee, { color: theme.brandDark }]}>
            ${doctor.fee}
            <Text style={[styles.feeUnit, { color: theme.textSecondary }]}>
              {' '}
              / visit
            </Text>
          </Text>
          {doctor.availableToday ? (
            <Text style={[styles.available, { color: theme.success }]}>
              Available Today
            </Text>
          ) : (
            <Text style={[styles.busy, { color: theme.textSecondary }]}>
              Next slots soon
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
  rating: {
    backgroundColor: '#FFF7ED',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ratingText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: '#EA580C',
  },
  specialty: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  bottomRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fee: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  feeUnit: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  available: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  busy: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
});

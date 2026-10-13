import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListSkeleton } from '@/components/skeleton';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useHospital } from '@/hooks/use-hospitals';
import { useTheme } from '@/hooks/use-theme';
import {
  hospitalAbout,
  hospitalCover,
  type PublicHospitalDoctor,
} from '@/types/hospital';

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { hospital, loading, error, refresh } = useHospital(id);

  if (loading) {
    return (
      <View style={[styles.pad, { backgroundColor: theme.background }]}>
        <ListSkeleton rows={5} />
      </View>
    );
  }

  if (error || !hospital) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.brandDark, fontFamily: Fonts.semibold }}>
          Hospital not found
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            fontFamily: Fonts.regular,
            textAlign: 'center',
            marginTop: 8,
          }}>
          {error || 'This facility is not available from the API.'}
        </Text>
        <Pressable onPress={refresh} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.primary, fontFamily: Fonts.semibold }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  const doctors = hospital.doctors ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      showsVerticalScrollIndicator={false}>
      <Image
        source={hospitalCover(hospital)}
        style={styles.hero}
        contentFit="cover"
      />
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.brandDark }]}>
          {hospital.companyName}
        </Text>
        <Text style={[styles.type, { color: theme.primary }]}>
          {hospital.industry || 'Health facility'}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {[hospital.city, hospital.country].filter(Boolean).join(' · ') ||
            'Location TBA'}
        </Text>
        {hospital.address ? (
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {hospital.address}
          </Text>
        ) : null}
        {hospital.phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${hospital.phone}`)}>
            <Text style={[styles.meta, { color: theme.primary }]}>
              {hospital.phone}
            </Text>
          </Pressable>
        ) : null}
        {hospital.website ? (
          <Pressable onPress={() => Linking.openURL(hospital.website!)}>
            <Text style={[styles.meta, { color: theme.primary }]}>
              {hospital.website}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.stats}>
          <Stat
            label="Rating"
            value={Number(hospital.rating || 0).toFixed(1)}
            theme={theme}
          />
          <Stat
            label="Reviews"
            value={String(hospital.totalReviews ?? 0)}
            theme={theme}
          />
          <Stat label="Doctors" value={String(doctors.length)} theme={theme} />
        </View>

        <Text style={[styles.section, { color: theme.brandDark }]}>About</Text>
        <Text style={[styles.about, { color: theme.textSecondary }]}>
          {hospitalAbout(hospital)}
        </Text>

        <Text style={[styles.section, { color: theme.brandDark }]}>
          Doctors at this facility
        </Text>
        <View style={styles.list}>
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <DoctorRow key={doctor.professionalProfileId} doctor={doctor} theme={theme} />
            ))
          ) : (
            <View
              style={[
                styles.empty,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontFamily: Fonts.regular,
                }}>
                No public doctors listed for this hospital yet.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function DoctorRow({
  doctor,
  theme,
}: {
  doctor: PublicHospitalDoctor;
  theme: ReturnType<typeof useTheme>;
}) {
  const name = doctor.user?.name || 'Doctor';
  const photo =
    doctor.publicPhotoUrl ||
    doctor.user?.picture ||
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80';
  const fee = doctor.consultationFee
    ? `${doctor.currency || 'USD'} ${doctor.consultationFee}`
    : 'Fee on request';

  return (
    <View
      style={[
        styles.doctorCard,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <Image source={photo} style={styles.doctorPhoto} contentFit="cover" />
      <View style={styles.doctorBody}>
        <View style={styles.doctorTop}>
          <Text
            style={[styles.doctorName, { color: theme.brandDark }]}
            numberOfLines={1}>
            {name}
          </Text>
          {doctor.isVerified ? (
            <Text style={[styles.verified, { color: theme.success }]}>
              Verified
            </Text>
          ) : null}
        </View>
        <Text style={[styles.doctorSpec, { color: theme.primary }]}>
          {doctor.specialization || 'General Physician'}
          {doctor.subSpecialty ? ` · ${doctor.subSpecialty}` : ''}
        </Text>
        {doctor.department?.name ? (
          <Text style={[styles.doctorMeta, { color: theme.textSecondary }]}>
            {doctor.department.name}
          </Text>
        ) : null}
        <Text style={[styles.doctorMeta, { color: theme.textSecondary }]}>
          {doctor.yearsOfExperience
            ? `${doctor.yearsOfExperience}+ yrs · `
            : ''}
          {fee}
        </Text>
        {doctor.languages?.length ? (
          <Text style={[styles.doctorMeta, { color: theme.textSecondary }]}>
            Languages: {doctor.languages.join(', ').toUpperCase()}
          </Text>
        ) : null}
        {doctor.publicBio ? (
          <Text
            style={[styles.doctorMeta, { color: theme.textSecondary }]}
            numberOfLines={3}>
            {doctor.publicBio}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        styles.stat,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <Text style={[styles.statValue, { color: theme.brandDark }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    flex: 1,
    padding: Spacing.four,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  hero: {
    width: '100%',
    height: 210,
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  type: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  meta: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  section: {
    marginTop: Spacing.three,
    fontFamily: Fonts.semibold,
    fontSize: 17,
  },
  about: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  list: {
    gap: Spacing.three,
  },
  empty: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  doctorCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  doctorPhoto: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
  },
  doctorBody: {
    flex: 1,
    gap: 2,
  },
  doctorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  doctorName: {
    flex: 1,
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
  verified: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  doctorSpec: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  doctorMeta: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
});

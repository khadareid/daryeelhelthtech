import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  listAppointmentsRequest,
  type AppointmentItem,
} from '@/lib/api';

const TABS = ['Upcoming', 'Past', 'All'] as const;

type ApptRow = {
  id: string;
  title: string;
  when: string;
  status: string;
  detail?: string;
  isPast: boolean;
};

export default function AppointmentsScreen() {
  const { profile, refreshProfile, accessToken, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Upcoming');
  const [remote, setRemote] = useState<AppointmentItem[]>([]);

  const loadRemote = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setRemote([]);
      return;
    }
    try {
      setRemote(await listAppointmentsRequest(accessToken));
    } catch {
      setRemote([]);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  const appointments = useMemo(() => {
    const live =
      remote.length > 0 ? remote : profile?.appointments ?? [];
    const now = Date.now();

    const rows: ApptRow[] = live.map((item) => {
      const time = new Date(item.scheduledAt).getTime();
      return {
        id: item.appointmentid,
        title:
          item.doctorName ||
          item.facilityName ||
          item.appointmentCode ||
          'Visit',
        when: new Date(item.scheduledAt).toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        status: item.status.replace(/_/g, ' '),
        detail: item.reason || undefined,
        isPast: time < now,
      };
    });

    if (tab === 'Upcoming') return rows.filter((item) => !item.isPast);
    if (tab === 'Past') return rows.filter((item) => item.isPast);
    return rows;
  }, [profile?.appointments, remote, tab]);

  return (
    <Screen
      onRefresh={async () => {
        await Promise.all([refreshProfile(), loadRemote()]);
      }}
      headerTitle="Appointments">
      <View>
        <Text style={styles.title}>Appointments</Text>
        <Text style={styles.subtitle}>
          Your booked visits — book from a doctor profile
        </Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = item === tab;
          return (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {appointments.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.doctor}>{item.title}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.when}>{item.when}</Text>
            {item.detail ? <Text style={styles.reason}>{item.detail}</Text> : null}
          </View>
        ))}

        {appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No appointments in this tab</Text>
            <Text style={styles.emptyText}>
              Book a doctor from the Doctors tab. Confirmed visits from your
              account will show here automatically.
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Brand.dark,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.muted,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Brand.white,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  tabActive: {
    backgroundColor: Brand.primary,
  },
  tabText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Brand.muted,
  },
  tabTextActive: {
    color: Brand.white,
  },
  list: {
    gap: Spacing.three,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  doctor: {
    flex: 1,
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Brand.dark,
  },
  status: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.primary,
    backgroundColor: Brand.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  when: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
  },
  reason: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.text,
  },
  emptyCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Brand.dark,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.muted,
  },
});

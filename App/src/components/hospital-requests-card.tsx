import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  listHospitalPatientRequests,
  respondHospitalPatientRequest,
  type HospitalPatientRequest,
} from '@/lib/api';

type QuickTab = 'pending' | 'accepted' | 'rejected' | 'all';

function formatWhen(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusColor(status: string) {
  const s = status.toUpperCase();
  if (s === 'ACCEPTED') return { bg: '#D1FAE5', fg: '#047857' };
  if (s === 'REJECTED') return { bg: '#FEE2E2', fg: '#B91C1C' };
  return { bg: '#FEF3C7', fg: '#B45309' };
}

type Props = {
  accessToken?: string | null;
  /** Compact = home strip; full = profile / appointments */
  compact?: boolean;
  onChanged?: () => void;
};

export function HospitalRequestsCard({
  accessToken,
  compact = false,
  onChanged,
}: Props) {
  const theme = useTheme();
  const [rows, setRows] = useState<HospitalPatientRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<QuickTab>('pending');

  const load = useCallback(async () => {
    if (!accessToken) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const list = await listHospitalPatientRequests(accessToken);
      setRows(list);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
    if (!accessToken) return;
    const timer = setInterval(() => {
      void load();
    }, 30_000);
    return () => clearInterval(timer);
  }, [accessToken, load]);

  const counts = useMemo(() => {
    const pending = rows.filter(
      (r) => String(r.status || '').toUpperCase() === 'PENDING',
    ).length;
    const accepted = rows.filter(
      (r) => String(r.status || '').toUpperCase() === 'ACCEPTED',
    ).length;
    const rejected = rows.filter(
      (r) => String(r.status || '').toUpperCase() === 'REJECTED',
    ).length;
    return { pending, accepted, rejected, all: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    if (tab === 'all') return rows;
    const want = tab.toUpperCase();
    return rows.filter((r) => String(r.status || '').toUpperCase() === want);
  }, [rows, tab]);

  async function onRespond(id: string, accept: boolean) {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await respondHospitalPatientRequest(id, accessToken, accept);
      Alert.alert(
        accept ? 'Request accepted' : 'Request rejected',
        accept
          ? 'The hospital has been notified on Daryeel SaaS.'
          : 'The hospital request was rejected.',
      );
      setTab(accept ? 'accepted' : 'rejected');
      await load();
      onChanged?.();
    } catch (e: unknown) {
      Alert.alert(
        'Could not respond',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!accessToken) return null;

  const tabs: Array<{ id: QuickTab; label: string; value: number }> = [
    { id: 'pending', label: 'Pending', value: counts.pending },
    { id: 'accepted', label: 'Accepted', value: counts.accepted },
    { id: 'rejected', label: 'Rejected', value: counts.rejected },
    { id: 'all', label: 'All', value: counts.all },
  ];

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flash-outline" size={18} color={Brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: Brand.primary }]}>
              Quick Actions
            </Text>
            <Text style={[styles.title, { color: theme.brandDark }]}>
              Hospital requests
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => void load()}
          hitSlop={8}
          style={styles.refreshBtn}>
          {loading ? (
            <ActivityIndicator color={Brand.primary} size="small" />
          ) : (
            <Ionicons name="refresh" size={18} color={Brand.primary} />
          )}
        </Pressable>
      </View>
      {!compact ? (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Kuwa kugu soo codsaday, aqbalay, diiday, iyo dhammaan — Health ID.
        </Text>
      ) : null}

      <View style={styles.tabsRow}>
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={[
                styles.tabChip,
                active
                  ? { backgroundColor: Brand.primary, borderColor: Brand.primary }
                  : {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
              ]}>
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? '#fff' : theme.textSecondary },
                ]}>
                {item.label}
              </Text>
              <Text
                style={[
                  styles.tabCount,
                  { color: active ? '#fff' : theme.brandDark },
                ]}>
                {item.value}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading && filtered.length === 0 ? (
        <ActivityIndicator color={Brand.primary} style={{ marginTop: 12 }} />
      ) : null}

      {!loading && filtered.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          {tab === 'pending'
            ? 'Ma jiraan requests pending ah.'
            : 'Waxba kuma jiraan qaybtan.'}
        </Text>
      ) : null}

      {filtered.map((req) => {
        const status = String(req.status || 'PENDING').toUpperCase();
        const colors = statusColor(status);
        return (
          <View
            key={req.id}
            style={[
              styles.card,
              {
                backgroundColor: '#FFFFFF',
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.cardTop}>
              <Text style={[styles.hospital, { color: theme.brandDark }]}>
                {req.hospitalName || 'Hospital'}
              </Text>
              <View style={[styles.statusPill, { backgroundColor: colors.bg }]}>
                <Text style={[styles.statusText, { color: colors.fg }]}>
                  {status}
                </Text>
              </View>
            </View>
            <Text style={[styles.meta, { color: Brand.primary }]}>
              {[req.doctorName, req.department || req.branchName]
                .filter(Boolean)
                .join(' · ') || 'Hospital staff'}
            </Text>
            {req.message ? (
              <Text style={[styles.message, { color: theme.textSecondary }]}>
                {req.message}
              </Text>
            ) : null}
            <Text style={[styles.when, { color: theme.textSecondary }]}>
              {formatWhen(req.createdAt)}
              {req.respondedAt ? ` · responded ${formatWhen(req.respondedAt)}` : ''}
              {req.healthId ? ` · ${req.healthId}` : ''}
            </Text>
            {status === 'PENDING' ? (
              <View style={styles.actions}>
                <Pressable
                  disabled={busyId === req.id}
                  onPress={() => void onRespond(req.id, true)}
                  style={[styles.btn, styles.acceptBtn]}>
                  {busyId === req.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.acceptText}>Accept</Text>
                  )}
                </Pressable>
                <Pressable
                  disabled={busyId === req.id}
                  onPress={() => void onRespond(req.id, false)}
                  style={[styles.btn, styles.rejectBtn]}>
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  tabChip: {
    flexGrow: 1,
    minWidth: '22%',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tabCount: {
    fontSize: 16,
    fontWeight: '800',
  },
  empty: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: 8,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  hospital: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  meta: {
    fontSize: 13,
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    marginTop: 4,
  },
  when: {
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: Brand.primary,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  rejectText: {
    color: '#BE123C',
    fontWeight: '700',
    fontSize: 14,
  },
});

import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { NotificationSkeleton } from '@/components/skeleton';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  listNotificationsRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  type NotificationItem,
} from '@/lib/api';

export default function NotificationsTabScreen() {
  const { accessToken, isAuthenticated } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!isAuthenticated || !accessToken) {
        setItems([]);
        setLoading(false);
        return;
      }
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      try {
        setItems(await listNotificationsRequest(accessToken));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, isAuthenticated],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  async function onMarkAll() {
    if (!accessToken) return;
    try {
      await markAllNotificationsReadRequest(accessToken);
      await load('refresh');
    } catch {
      /* ignore */
    }
  }

  async function onMarkOne(id: string) {
    if (!accessToken) return;
    try {
      await markNotificationReadRequest(id, accessToken);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      /* ignore */
    }
  }

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <Screen
      onRefresh={() => load('refresh')}
      refreshing={refreshing}
      headerTitle="Alerts">
      <View style={styles.top}>
        <View style={styles.topCopy}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.lead}>
            Booking, payment, and care alerts from your Daryeel account.
          </Text>
        </View>
        {unread > 0 ? (
          <Pressable onPress={onMarkAll} hitSlop={8}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {unread > 0 ? (
        <Text style={styles.badge}>{unread} unread</Text>
      ) : null}

      {loading ? <NotificationSkeleton rows={6} /> : null}

      {!loading && items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>
            Alerts for appointments, payments, and records will appear here.
          </Text>
        </View>
      ) : null}

      {!loading
        ? items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (!item.isRead) void onMarkOne(item.id);
              }}
              style={[styles.card, !item.isRead && styles.cardUnread]}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!item.isRead ? <View style={styles.dot} /> : null}
              </View>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.meta}>
                {item.type.replace(/_/g, ' ')} ·{' '}
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </Pressable>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  topCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Brand.dark,
  },
  lead: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.muted,
    lineHeight: 20,
  },
  markAll: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.primary,
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.primary,
    backgroundColor: Brand.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  empty: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Brand.dark,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 6,
  },
  cardUnread: {
    borderColor: Brand.primary,
    backgroundColor: Brand.light,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Brand.dark,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.primary,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.dark,
    lineHeight: 18,
  },
  meta: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.muted,
  },
});

import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  listNotificationsRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  type NotificationItem,
} from '@/lib/api';

export default function NotificationsScreen() {
  const { accessToken, isAuthenticated } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await listNotificationsRequest(accessToken));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  async function onMarkAll() {
    if (!accessToken) return;
    try {
      await markAllNotificationsReadRequest(accessToken);
      await load();
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

  return (
    <Screen
      onRefresh={load}
      refreshing={loading}
      header={false}
      contentStyle={{ paddingTop: Spacing.three }}>
      <View style={styles.top}>
        <Text style={styles.lead}>
          Appointment and care alerts from your Daryeel account.
        </Text>
        {items.some((n) => !n.isRead) ? (
          <Pressable onPress={onMarkAll}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>
            Alerts for appointments, payments, and records will appear here.
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (!item.isRead) void onMarkOne(item.id);
            }}
            style={[styles.card, !item.isRead && styles.cardUnread]}>
            <View style={styles.cardTop}>
              <Text style={styles.title}>{item.title}</Text>
              {!item.isRead ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.meta}>
              {item.type.replace(/_/g, ' ')} ·{' '}
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </Pressable>
        ))
      )}
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
  lead: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Brand.muted,
    lineHeight: 20,
  },
  markAll: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Brand.primary,
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
  title: {
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

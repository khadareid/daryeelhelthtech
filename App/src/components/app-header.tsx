import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { siteConfig } from '@/config/site';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';
import { listNotificationsRequest } from '@/lib/api';
import { useEffect, useState } from 'react';

type Props = {
  title?: string;
  subtitle?: string;
  showBrand?: boolean;
  compact?: boolean;
};

/** Full tab header — brand, page title, theme + alerts. Stays fixed (not scrolled away). */
export function AppHeader({
  title,
  subtitle,
  showBrand = true,
  compact = false,
}: Props) {
  const theme = useTheme();
  const { isDark, toggleTheme } = useThemePreference();
  const { accessToken, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setUnread(0);
      return;
    }
    listNotificationsRequest(accessToken)
      .then((items) => setUnread(items.filter((n) => !n.isRead).length))
      .catch(() => setUnread(0));
  }, [accessToken, isAuthenticated, title]);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + (compact ? 6 : 10),
          backgroundColor: theme.backgroundElement,
          borderBottomColor: theme.border,
        },
      ]}>
      <View style={[styles.row, isNarrow && styles.rowNarrow]}>
        <View style={styles.brandBlock}>
          {showBrand ? (
            <View style={styles.logoRow}>
              <View
                style={[styles.logoMark, { backgroundColor: theme.primary }]}>
                <Text style={styles.logoLetter}>D</Text>
              </View>
              <View style={styles.brandText}>
                <Text
                  style={[styles.brandName, { color: theme.brandDark }]}
                  numberOfLines={1}>
                  {siteConfig.appName}
                </Text>
                {title ? (
                  <Text
                    style={[styles.pageTitle, { color: theme.textSecondary }]}
                    numberOfLines={1}>
                    {title}
                    {subtitle ? ` · ${subtitle}` : ''}
                  </Text>
                ) : (
                  <Text
                    style={[styles.tagline, { color: theme.textSecondary }]}
                    numberOfLines={1}>
                    {siteConfig.tagline}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View>
              <Text style={[styles.standaloneTitle, { color: theme.brandDark }]}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.tagline, { color: theme.textSecondary }]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Toggle dark mode"
            onPress={toggleTheme}
            style={[
              styles.iconBtn,
              {
                backgroundColor: theme.backgroundSelected,
                borderColor: theme.border,
              },
            ]}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={theme.primary}
            />
          </Pressable>

          <Pressable
            accessibilityLabel="Notifications"
            onPress={() => router.push('/(tabs)/notifications')}
            style={[
              styles.iconBtn,
              {
                backgroundColor: theme.backgroundSelected,
                borderColor: theme.border,
              },
            ]}>
            <Ionicons
              name="notifications-outline"
              size={18}
              color={theme.primary}
            />
            {unread > 0 ? (
              <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                <Text style={styles.badgeText}>
                  {unread > 9 ? '9+' : unread}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowNarrow: {
    gap: Spacing.two,
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  brandText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  brandName: {
    fontFamily: Fonts.bold,
    fontSize: 17,
  },
  pageTitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  tagline: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  standaloneTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
});

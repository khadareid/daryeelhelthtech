import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** When false, hide custom header (use Expo Stack header instead). */
  showHeader?: boolean;
};

/**
 * Full header (with Back) + scroll body + optional sticky footer.
 * Use on stack screens outside bottom tabs.
 */
export function StackScreen({
  title,
  subtitle,
  children,
  onRefresh,
  refreshing,
  footer,
  contentStyle,
  showHeader = true,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {showHeader ? (
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: theme.backgroundElement,
              borderBottomColor: theme.border,
            },
          ]}>
          <Pressable
            accessibilityLabel="Go back"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            }}
            style={[styles.backBtn, { borderColor: theme.border }]}>
            <Ionicons name="chevron-back" size={22} color={theme.primary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text
              style={[styles.title, { color: theme.brandDark }]}
              numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.subtitle, { color: theme.textSecondary }]}
                numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.headerSpacer} />
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: footer
              ? Spacing.four
              : insets.bottom + Spacing.five,
          },
          contentStyle,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          ) : undefined
        }>
        <View style={styles.inner}>{children}</View>
      </ScrollView>

      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: theme.backgroundElement,
              borderTopColor: theme.border,
            },
          ]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.three,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.light,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontFamily: Fonts.bold, fontSize: 17 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 12, marginTop: 1 },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
});

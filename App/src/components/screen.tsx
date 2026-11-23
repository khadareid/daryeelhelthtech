import { useSegments } from 'expo-router';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { PersistentTabBar } from '@/components/persistent-tab-bar';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Extra space under scroll content so the last card clears the FAB / bar. */
export const SCREEN_SCROLL_BOTTOM = Spacing.five + 8;

type Props = {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  header?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  showBrand?: boolean;
};

export function Screen({
  children,
  contentStyle,
  refreshing,
  onRefresh,
  scroll = true,
  header = true,
  headerTitle,
  headerSubtitle,
  showBrand = true,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const inTabs = segments[0] === '(tabs)';
  /** Tab bar sits in layout (AppTabs or PersistentTabBar) — do not double-reserve ~130px. */
  const padding = {
    paddingTop: header ? Spacing.three : insets.top + Spacing.three,
    paddingBottom: SCREEN_SCROLL_BOTTOM,
    paddingHorizontal: Spacing.three,
  };

  const body = (
    <View style={[styles.inner, !scroll && styles.innerFill]}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {header ? (
        <AppHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          showBrand={showBrand}
          showBack={!inTabs}
        />
      ) : null}
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          contentContainerStyle={[styles.content, padding, contentStyle]}
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
          {body}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.fill,
            {
              paddingTop: padding.paddingTop,
              paddingHorizontal: padding.paddingHorizontal,
            },
            contentStyle,
          ]}>
          {body}
        </View>
      )}
      {!inTabs ? <PersistentTabBar /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  innerFill: {
    flex: 1,
  },
});

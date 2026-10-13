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
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const padding = {
    paddingTop: header ? Spacing.three : insets.top + Spacing.three,
    paddingBottom: insets.bottom + 130,
    paddingHorizontal: Spacing.four,
  };

  const body = (
    <View style={styles.inner}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {header ? (
        <AppHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          showBrand={showBrand}
        />
      ) : null}
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
        <View style={[styles.content, padding, contentStyle, { flex: 1 }]}>
          {body}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
});

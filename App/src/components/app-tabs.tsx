import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import type { Href } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickActionSheet } from '@/components/quick-action-sheet';
import { Brand, Fonts } from '@/constants/theme';
import { elevate } from '@/lib/elevate';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * IMPORTANT: TabTrigger must be a direct child of TabList (or Fragment).
 * Wrapping triggers in View breaks screen registration in expo-router/ui.
 */
export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <View style={styles.root}>
      <Tabs>
        <TabSlot style={styles.slot} />

        <TabList
          style={[
            styles.barWrap,
            elevate('bar'),
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}>
          <TabTrigger name="home" href="/(tabs)" asChild>
            <TabButton label="Home" icon="home-outline" iconActive="home" />
          </TabTrigger>

          <TabTrigger name="doctors" href="/(tabs)/doctors" asChild>
            <TabButton
              label="Doctors"
              icon="medkit-outline"
              iconActive="medkit"
            />
          </TabTrigger>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quick actions"
            onPress={() => setQuickOpen(true)}
            style={({ pressed }) => [
              styles.fabSlot,
              pressed && styles.fabPressed,
            ]}>
            <LinearGradient
              colors={[Brand.primary, '#0B3D91']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.fab, elevate('fab')]}>
              <Ionicons name="add" size={30} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.fabLabel}>Actions</Text>
          </Pressable>

          <TabTrigger name="health" href="/(tabs)/health" asChild>
            <TabButton
              label="Health"
              icon="heart-outline"
              iconActive="heart"
            />
          </TabTrigger>

          <TabTrigger name="profile" href="/(tabs)/profile" asChild>
            <TabButton
              label="Profile"
              icon="person-outline"
              iconActive="person"
            />
          </TabTrigger>

          {/* Registered routes, visually hidden — must stay direct TabList children */}
          <TabTrigger
            name="appointments"
            href="/(tabs)/appointments"
            style={styles.hiddenTrigger}
          />
          <TabTrigger
            name="hospitals"
            href={'/(tabs)/hospitals' as Href}
            style={styles.hiddenTrigger}
          />
        </TabList>
      </Tabs>

      <QuickActionSheet
        visible={quickOpen}
        onClose={() => setQuickOpen(false)}
      />
    </View>
  );
}

function TabButton({
  label,
  icon,
  iconActive,
  isFocused,
  href,
  style: _style,
  ...props
}: TabTriggerSlotProps & {
  label: string;
  icon: IconName;
  iconActive: IconName;
}) {
  const color = isFocused ? Brand.primary : '#94A3B8';
  const iconName = isFocused ? iconActive : icon;

  const safeProps =
    typeof href === 'string' && href.length > 0
      ? { ...props, href }
      : props;

  return (
    <Pressable
      {...safeProps}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(isFocused) }}
      style={styles.item}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={22} color={color} />
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.indicator, isFocused && styles.indicatorOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  slot: {
    flex: 1,
  },
  barWrap: {
    backgroundColor: Brand.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    alignItems: 'flex-end',
    paddingHorizontal: 6,
    paddingTop: 10,
    minHeight: 68,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  iconWrap: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },
  indicator: {
    marginTop: 2,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorOn: {
    backgroundColor: Brand.primary,
  },
  fabSlot: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Brand.white,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.95,
  },
  fabLabel: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Brand.primary,
    marginTop: 2,
  },
  hiddenTrigger: {
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
  },
});

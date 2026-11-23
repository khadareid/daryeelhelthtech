import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname, type Href } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickActionSheet } from '@/components/quick-action-sheet';
import { Brand, Fonts } from '@/constants/theme';
import { elevate } from '@/lib/elevate';

type IconName = ComponentProps<typeof Ionicons>['name'];

type TabItem = {
  key: string;
  label: string;
  href: Href;
  icon: IconName;
  iconActive: IconName;
  match: (path: string) => boolean;
};

const LEFT_TABS: TabItem[] = [
  {
    key: 'home',
    label: 'Home',
    href: '/(tabs)',
    icon: 'home-outline',
    iconActive: 'home',
    match: (p) =>
      p === '/' ||
      p === '/(tabs)' ||
      (p.endsWith('/(tabs)') &&
        !p.includes('hospital') &&
        !p.includes('appointment') &&
        !p.includes('profile')),
  },
  {
    key: 'hospitals',
    label: 'Hospitals',
    href: '/(tabs)/hospitals',
    icon: 'business-outline',
    iconActive: 'business',
    match: (p) => p.includes('hospital') || p.includes('healthcare'),
  },
];

const RIGHT_TABS: TabItem[] = [
  {
    key: 'appointments',
    label: 'Visits',
    href: '/(tabs)/appointments',
    icon: 'calendar-outline',
    iconActive: 'calendar',
    match: (p) => p.includes('appointment'),
  },
  {
    key: 'profile',
    label: 'Profile',
    href: '/(tabs)/profile',
    icon: 'person-outline',
    iconActive: 'person',
    match: (p) => p.includes('profile'),
  },
];

/** Home · Hospitals · + · Visits · Profile */
export function PersistentTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <>
      <View
        style={[
          styles.barWrap,
          elevate('bar'),
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}>
        {LEFT_TABS.map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            active={tab.match(pathname)}
            onPress={() => router.replace(tab.href)}
          />
        ))}

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

        {RIGHT_TABS.map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            active={tab.match(pathname)}
            onPress={() => router.replace(tab.href)}
          />
        ))}
      </View>

      <QuickActionSheet
        visible={quickOpen}
        onClose={() => setQuickOpen(false)}
      />
    </>
  );
}

function TabButton({
  tab,
  active,
  onPress,
}: {
  tab: TabItem;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? Brand.primary : '#94A3B8';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.item}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={active ? tab.iconActive : tab.icon}
          size={22}
          color={color}
        />
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {tab.label}
      </Text>
      <View style={[styles.indicator, active && styles.indicatorOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    backgroundColor: Brand.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    flexDirection: 'row',
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
});

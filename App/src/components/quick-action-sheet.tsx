import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { siteConfig } from '@/config/site';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Mirrors Website care-app Actions sheet */
const ACTIONS: {
  id: string;
  title: string;
  icon: IconName;
  color: string;
  bg: string;
  href?: Href;
  emergency?: boolean;
}[] = [
  {
    id: 'book',
    title: 'Book visit',
    icon: 'calendar',
    color: Brand.primary,
    bg: Brand.light,
    href: '/(tabs)/doctors',
  },
  {
    id: 'payments',
    title: 'Payments',
    icon: 'card',
    color: '#0F766E',
    bg: '#CCFBF1',
    href: '/health/payments',
  },
  {
    id: 'health',
    title: 'Daily health',
    icon: 'fitness',
    color: '#0F766E',
    bg: '#CCFBF1',
    href: '/(tabs)/health',
  },
  {
    id: 'vitals',
    title: 'Vitals',
    icon: 'heart',
    color: '#BE123C',
    bg: '#FFE4E6',
    href: '/health/vitals',
  },
  {
    id: 'medications',
    title: 'Medications',
    icon: 'flask',
    color: '#7C3AED',
    bg: '#EDE9FE',
    href: '/health/medications',
  },
  {
    id: 'allergies',
    title: 'Allergies',
    icon: 'warning',
    color: '#B45309',
    bg: '#FEF3C7',
    href: '/health/allergies',
  },
  {
    id: 'prescriptions',
    title: 'Prescriptions',
    icon: 'document-text',
    color: '#0369A1',
    bg: '#E0F2FE',
    href: '/health/prescriptions',
  },
  {
    id: 'records',
    title: 'Records',
    icon: 'folder-open',
    color: '#0B3D91',
    bg: Brand.light,
    href: '/health/medical-records',
  },
  {
    id: 'family',
    title: 'Family',
    icon: 'people',
    color: '#0369A1',
    bg: '#E0F2FE',
    href: '/health/family',
  },
  {
    id: 'emergency',
    title: 'Emergency',
    icon: 'shield-checkmark',
    color: Brand.danger,
    bg: '#FEE2E2',
    href: '/health/emergency-card',
  },
  {
    id: 'visits',
    title: 'Visits',
    icon: 'time',
    color: '#B45309',
    bg: '#FEF3C7',
    href: '/(tabs)/appointments',
  },
  {
    id: 'notify',
    title: 'Alerts',
    icon: 'notifications',
    color: '#C2410C',
    bg: '#FFEDD5',
    href: '/notifications',
  },
  {
    id: 'profile',
    title: 'My Profile',
    icon: 'person',
    color: Brand.primary,
    bg: Brand.light,
    href: '/(tabs)/profile',
  },
  {
    id: 'call',
    title: 'Emergency call',
    icon: 'call',
    color: Brand.danger,
    bg: '#FEE2E2',
    emergency: true,
  },
];

export function QuickActionSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  function run(action: (typeof ACTIONS)[number]) {
    onClose();
    setTimeout(() => {
      if (action.emergency) {
        Linking.openURL(`tel:${siteConfig.supportPhone}`).catch(() => {
          Linking.openURL(`mailto:${siteConfig.supportEmail}`);
        });
        return;
      }
      if (action.href) router.push(action.href);
    }, 120);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Quick actions</Text>
        <Text style={styles.sub}>
          Same care tools as the web app — records, visits, payments & more
        </Text>
        <View style={styles.grid}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => run(action)}
              style={styles.item}>
              <View style={[styles.iconWrap, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={styles.itemLabel} numberOfLines={2}>
                {action.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sheet: {
    backgroundColor: Brand.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    maxHeight: '78%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
    marginBottom: Spacing.three,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Brand.dark,
  },
  sub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
    marginTop: 4,
    marginBottom: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: Spacing.four,
  },
  item: {
    width: '22%',
    minWidth: 72,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Brand.dark,
    textAlign: 'center',
  },
});

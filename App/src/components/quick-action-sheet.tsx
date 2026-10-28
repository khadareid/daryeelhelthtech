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
    id: 'chat',
    title: 'Doctor chat',
    icon: 'chatbubbles',
    color: '#0369A1',
    bg: '#E0F2FE',
    href: '/(tabs)/doctors',
  },
  {
    id: 'doctors',
    title: 'Doctors',
    icon: 'medkit',
    color: '#0369A1',
    bg: '#E0F2FE',
    href: '/(tabs)/doctors',
  },
  {
    id: 'hospital',
    title: 'Hospitals',
    icon: 'business',
    color: '#4338CA',
    bg: '#E0E7FF',
    href: '/(tabs)/hospitals' as Href,
  },
  {
    id: 'track',
    title: 'Health Daily',
    icon: 'fitness',
    color: '#0F766E',
    bg: '#CCFBF1',
    href: '/(tabs)/health',
  },
  {
    id: 'appointments',
    title: 'Appointments',
    icon: 'time',
    color: '#B45309',
    bg: '#FEF3C7',
    href: '/(tabs)/appointments',
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
    id: 'med',
    title: 'Medications',
    icon: 'flask',
    color: '#7C3AED',
    bg: '#EDE9FE',
    href: '/(tabs)/profile',
  },
  {
    id: 'record',
    title: 'Records',
    icon: 'document-text',
    color: '#0B3D91',
    bg: Brand.light,
    href: '/(tabs)/profile',
  },
  {
    id: 'news',
    title: 'Health news',
    icon: 'newspaper',
    color: '#0F766E',
    bg: '#CCFBF1',
    href: '/news' as Href,
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
    id: 'emergency',
    title: 'Emergency',
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
      if (action.href) {
        router.push(action.href);
      }
    }, 180);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Quick actions</Text>
          <Text style={styles.subtitle}>
            Choose a care tool — 9 shortcuts in one place
          </Text>

          <View style={styles.grid}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                style={({ pressed }) => [
                  styles.cell,
                  action.emergency && styles.emergencyCell,
                  pressed && styles.pressed,
                ]}
                onPress={() => run(action)}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: action.bg },
                    action.emergency && styles.emergencyIcon,
                  ]}>
                  <Ionicons
                    name={action.icon}
                    size={22}
                    color={action.emergency ? Brand.white : action.color}
                  />
                </View>
                <Text
                  style={[
                    styles.cellTitle,
                    action.emergency && styles.emergencyTitle,
                  ]}
                  numberOfLines={2}>
                  {action.title}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 61, 145, 0.45)',
  },
  sheet: {
    backgroundColor: Brand.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Brand.border,
    marginBottom: Spacing.two,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Brand.dark,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Brand.muted,
    marginBottom: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  cell: {
    width: '31.5%',
    minHeight: 108,
    backgroundColor: Brand.bg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
    gap: 10,
  },
  emergencyCell: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyIcon: {
    backgroundColor: Brand.danger,
  },
  cellTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Brand.dark,
    textAlign: 'center',
    lineHeight: 16,
  },
  emergencyTitle: {
    color: Brand.danger,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: 4,
  },
  cancelText: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Brand.muted,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={[styles.card, { marginBottom: Math.max(insets.bottom, 24) }]}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: danger ? '#FEE2E2' : Brand.light },
            ]}>
            <Ionicons
              name={danger ? 'log-out-outline' : 'help-circle-outline'}
              size={28}
              color={danger ? Brand.danger : Brand.primary}
            />
          </View>

          <Text style={styles.brand}>Daryeel Health</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="outline"
              onPress={onCancel}
              disabled={loading}
              style={styles.btn}
            />
            <Button
              title={confirmLabel}
              variant={danger ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={loading}
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 61, 145, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Brand.white,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  brand: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Brand.primary,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Brand.dark,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.muted,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  btn: {
    flex: 1,
    minHeight: 48,
  },
});

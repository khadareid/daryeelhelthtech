import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PhoneField } from '@/components/phone-field';
import { Button } from '@/components/ui/button';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { updateMeRequest } from '@/lib/api';
import { isValidPhone, normalizePhone } from '@/lib/phone';

/**
 * Blocks signed-in users who have no phone until they save one.
 * Existing users with a phone are not shown this modal.
 */
export function PhoneRequiredGate() {
  const { user, profile, accessToken, refreshProfile, isAuthenticated } =
    useAuth();
  const existing = String(profile?.phone || user?.phone || '').trim();
  const needsPhone = Boolean(isAuthenticated && accessToken && !existing);
  const [visible, setVisible] = useState(needsPhone);
  const [phone, setPhone] = useState('+252');
  const [saving, setSaving] = useState(false);

  // Show immediately after register/login when phone is missing (English prompt).
  useEffect(() => {
    setVisible(needsPhone);
    if (!needsPhone) setPhone('+252');
  }, [needsPhone]);

  if (!needsPhone && !visible) return null;

  async function onSave() {
    if (!accessToken) return;
    if (!isValidPhone(phone)) {
      Alert.alert(
        'Phone required',
        'Enter a valid number, e.g. +252 63 XXX XXXX',
      );
      return;
    }
    try {
      setSaving(true);
      await updateMeRequest({ phone: normalizePhone(phone) }, accessToken);
      await refreshProfile();
      setVisible(false);
      Alert.alert('Saved', 'Your phone number was added.');
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Add your phone number</Text>
          <Text style={styles.sub}>
            Registered successfully. Please enter your phone number to continue.
          </Text>
          <PhoneField value={phone} onChange={setPhone} />
          <Text style={styles.hint}>Example: +252 63 XXX XXXX</Text>
          <Button
            title={saving ? 'Saving…' : 'Save & continue'}
            loading={saving}
            onPress={() => void onSave()}
          />
          <Pressable disabled={saving} onPress={() => undefined}>
            <Text style={styles.note}>You cannot skip this step</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Brand.dark,
  },
  sub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.muted,
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Brand.muted,
  },
  note: {
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Brand.muted,
  },
});

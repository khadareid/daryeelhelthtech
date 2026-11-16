import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import {
  DEFAULT_DIAL,
  PHONE_DIALS,
  joinPhone,
  splitPhone,
} from '@/lib/phone';

type Props = {
  value: string;
  onChange: (e164: string) => void;
  placeholder?: string;
};

/** Country-code phone field for App register / profile. No OTP. */
export function PhoneField({
  value,
  onChange,
  placeholder = '63 XXX XXXX',
}: Props) {
  const { dial, national } = splitPhone(value || DEFAULT_DIAL);

  function cycleDial() {
    const idx = PHONE_DIALS.indexOf(dial as (typeof PHONE_DIALS)[number]);
    const next = PHONE_DIALS[(idx + 1) % PHONE_DIALS.length] || DEFAULT_DIAL;
    onChange(joinPhone(next, national));
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={cycleDial} style={styles.dial}>
        <Text style={styles.dialText}>{dial}</Text>
      </Pressable>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder={placeholder}
        placeholderTextColor={Brand.muted}
        value={national}
        onChangeText={(t) => onChange(joinPhone(dial, t.replace(/[^\d]/g, '')))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dial: {
    minWidth: 78,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    minHeight: 52,
  },
  dialText: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Brand.primary,
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.white,
    paddingHorizontal: Spacing.three,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Brand.dark,
  },
});

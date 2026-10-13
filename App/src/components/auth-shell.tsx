import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';

type AuthFieldProps = TextInputProps & {
  label?: string;
  right?: React.ReactNode;
};

export function AuthField({ label, right, style, ...rest }: AuthFieldProps) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.fieldBox}>
        <TextInput
          placeholderTextColor={Brand.muted}
          style={[styles.fieldInput, style]}
          {...rest}
        />
        {right}
      </View>
    </View>
  );
}

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Brand.dark, Brand.primary, '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <View style={styles.logo}>
          <Text style={styles.logoMark}>+</Text>
        </View>
        <Text style={styles.brand}>Daryeel</Text>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
        <View style={styles.wave} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 28 },
          ]}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 48,
    gap: Spacing.one,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: Brand.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  logoMark: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Brand.primary,
  },
  brand: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Brand.white,
  },
  headerTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
  },
  headerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: 'rgba(239,246,255,0.85)',
  },
  wave: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: -28,
    height: 56,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
    backgroundColor: Brand.bg,
  },
  body: {
    flex: 1,
    marginTop: -8,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Brand.text,
  },
  fieldBox: {
    minHeight: 54,
    borderRadius: Radius.lg,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  fieldInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Brand.text,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
});

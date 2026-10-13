import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'white' | 'danger';

type Props = PressableProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const looks: Record<Variant, { container: ViewStyle; text: string }> = {
  primary: { container: { backgroundColor: Brand.primary }, text: Brand.white },
  secondary: { container: { backgroundColor: Brand.dark }, text: Brand.white },
  outline: {
    container: {
      backgroundColor: Brand.white,
      borderWidth: 1.5,
      borderColor: Brand.border,
    },
    text: Brand.dark,
  },
  ghost: { container: { backgroundColor: Brand.light }, text: Brand.primary },
  white: { container: { backgroundColor: Brand.white }, text: Brand.primary },
  danger: { container: { backgroundColor: Brand.danger }, text: Brand.white },
};

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
  ...rest
}: Props) {
  const look = looks[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        look.container,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={look.text} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, { color: look.text }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.55,
  },
});

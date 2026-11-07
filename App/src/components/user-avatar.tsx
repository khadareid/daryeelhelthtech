import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Brand, Fonts } from '@/constants/theme';

type Props = {
  name?: string | null;
  photo?: string | null;
  gender?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

function initialsOf(name?: string | null) {
  if (!name?.trim()) return 'U';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function genderKind(gender?: string | null): 'male' | 'female' | 'unknown' {
  const g = String(gender || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (
    g === 'MALE' ||
    g === 'M' ||
    g === 'MAN' ||
    g === 'BOY' ||
    g.startsWith('MALE')
  ) {
    return 'male';
  }
  if (
    g === 'FEMALE' ||
    g === 'F' ||
    g === 'WOMAN' ||
    g === 'FML' ||
    g === 'GIRL' ||
    g.startsWith('FEMALE')
  ) {
    return 'female';
  }
  return 'unknown';
}

/** Photo when available; otherwise man/woman icon from gender, else name initials. */
export function UserAvatar({
  name,
  photo,
  gender,
  size = 56,
  style,
}: Props) {
  const kind = genderKind(gender);
  const radius = size / 2;
  const iconSize = Math.round(size * 0.48);

  if (photo) {
    return (
      <Image
        source={photo}
        style={[
          styles.photo,
          { width: size, height: size, borderRadius: radius },
          style as object,
        ]}
        contentFit="cover"
      />
    );
  }

  if (kind === 'male') {
    return (
      <View
        style={[
          styles.fallback,
          styles.male,
          { width: size, height: size, borderRadius: radius },
          style,
        ]}>
        <Ionicons name="man" size={iconSize} color={Brand.primary} />
      </View>
    );
  }

  if (kind === 'female') {
    return (
      <View
        style={[
          styles.fallback,
          styles.female,
          { width: size, height: size, borderRadius: radius },
          style,
        ]}>
        <Ionicons name="woman" size={iconSize} color="#C026A8" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        styles.neutral,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.32) }]}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    backgroundColor: Brand.light,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  male: {
    backgroundColor: Brand.light,
    borderColor: '#BFDBFE',
  },
  female: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
  },
  neutral: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  initials: {
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
});

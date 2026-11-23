import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';

export function InfoHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.hero}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSub}>{subtitle}</Text> : null}
    </View>
  );
}

export function InfoCard({
  title,
  children,
  meta,
}: {
  title: string;
  children?: ReactNode;
  meta?: string;
}) {
  return (
    <View style={styles.card}>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function InfoPage({
  headerTitle,
  headerSubtitle,
  children,
}: {
  headerTitle: string;
  headerSubtitle?: string;
  children: ReactNode;
}) {
  return (
    <Screen headerTitle={headerTitle} headerSubtitle={headerSubtitle} scroll={false}>
      <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  hero: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    color: Brand.white,
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  heroSub: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  meta: {
    color: Brand.primary,
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: Brand.dark,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
});

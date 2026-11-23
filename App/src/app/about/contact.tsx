import { Image, Linking, Pressable, Text, View } from 'react-native';

import { InfoPage } from '@/components/info-page';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

const CHANNELS = [
  {
    label: 'Phone',
    value: '+252 63 0000000',
    href: 'tel:+252630000000',
  },
  {
    label: 'Email',
    value: 'hello@daryeelhealth.com',
    href: 'mailto:hello@daryeelhealth.com',
  },
  {
    label: 'Website',
    value: 'daryeelhealth.com',
    href: 'https://daryeelhealth.com',
  },
];

export default function ContactScreen() {
  const responsive = useResponsive();
  const cols = Math.min(responsive.gridColumns, 3);
  const gap = responsive.gap;
  const cardW =
    cols === 1
      ? ('100%' as const)
      : (responsive.contentWidth - gap * (cols - 1)) / cols;

  return (
    <InfoPage headerTitle="Contact" headerSubtitle="We are here to help">
      <View style={styles.hero}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1200',
          }}
          style={[styles.heroImage, { height: responsive.heroHeight }]}
        />
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>Get in touch</Text>
          <Text style={[styles.title, { fontSize: responsive.titleSize }]}>
            Contact Daryeel
          </Text>
          <Text style={[styles.sub, { fontSize: responsive.bodySize }]}>
            Reach our team for partnerships, support, or general questions.
          </Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=1000',
          }}
          style={styles.mapImage}
        />
        <View style={styles.mapBody}>
          <Text style={styles.cardTitle}>Visit us</Text>
          <Text style={[styles.body, { fontSize: responsive.bodySize }]}>
            Hargeisa, Somaliland — digital health for families and hospitals
            across the region.
          </Text>
        </View>
      </View>

      <View style={[styles.grid, { gap }]}>
        {CHANNELS.map((c) => (
          <Pressable
            key={c.label}
            onPress={() => Linking.openURL(c.href)}
            style={({ pressed }) => [
              styles.channel,
              { width: cardW },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.meta}>{c.label}</Text>
            <Text style={styles.channelValue}>{c.value}</Text>
          </Pressable>
        ))}
      </View>
    </InfoPage>
  );
}

const styles = {
  hero: {
    borderRadius: Radius.lg,
    overflow: 'hidden' as const,
  },
  heroImage: { width: '100%' as const, height: 160 },
  heroText: {
    padding: Spacing.four,
    backgroundColor: 'rgba(11,61,145,0.92)',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase' as const,
  },
  title: {
    marginTop: 6,
    color: Brand.white,
    fontFamily: Fonts.bold,
    fontSize: 22,
  },
  sub: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  mapCard: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden' as const,
  },
  mapImage: { width: '100%' as const, height: 140 },
  mapBody: { padding: Spacing.three, gap: 4 },
  cardTitle: {
    color: Brand.dark,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  body: {
    color: Brand.muted,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  channel: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
    gap: 4,
  },
  meta: {
    color: Brand.primary,
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase' as const,
  },
  channelValue: {
    color: Brand.dark,
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
};

import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen, SCREEN_SCROLL_BOTTOM } from '@/components/screen';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { itemSlug, type CmsListBody } from '@/lib/cms-list';
import type { CmsListItem, CmsListStat } from '@/lib/api';

export function CmsListScreen({
  headerTitle,
  headerSubtitle,
  heroTitle,
  heroSubtitle,
  heroImage,
  stats,
  items,
  detailBase,
}: {
  headerTitle: string;
  headerSubtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  stats: CmsListStat[];
  items: CmsListItem[];
  detailBase: '/about/training' | '/about/events' | '/about/insights';
}) {
  const responsive = useResponsive();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('all');

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.tag?.trim()) set.add(item.tag.trim());
    }
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tag !== 'all' && (item.tag || '').trim() !== tag) return false;
      if (!q) return true;
      return [item.title, item.meta, item.description, item.tag]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, tag]);

  const listColumns = responsive.gridColumns;
  const cardWidth =
    listColumns === 1
      ? undefined
      : (responsive.contentWidth -
          responsive.gap * (listColumns - 1)) /
        listColumns;

  return (
    <Screen headerTitle={headerTitle} headerSubtitle={headerSubtitle} scroll={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image
            source={{ uri: heroImage }}
            style={[styles.heroImage, { height: responsive.heroHeight }]}
            resizeMode="cover"
          />
          <View style={styles.heroText}>
            <Text style={styles.eyebrow}>{headerTitle}</Text>
            <Text style={[styles.title, { fontSize: responsive.titleSize }]}>
              {heroTitle}
            </Text>
            <Text style={[styles.sub, { fontSize: responsive.bodySize }]}>
              {heroSubtitle}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={[
                styles.stat,
                {
                  minWidth: responsive.isPhone ? '45%' : '22%',
                  flexBasis: responsive.isPhone ? '45%' : '22%',
                },
              ]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={Brand.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${headerTitle.toLowerCase()}…`}
            placeholderTextColor={Brand.muted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Pressable
            onPress={() => setTag('all')}
            style={[styles.chip, tag === 'all' && styles.chipActive]}
          >
            <Text style={[styles.chipText, tag === 'all' && styles.chipTextActive]}>
              All · {items.length}
            </Text>
          </Pressable>
          {tags.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTag(t)}
              style={[styles.chip, tag === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, tag === t && styles.chipTextActive]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.listCount}>
          {filtered.length} shown
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: responsive.gap,
          }}>
          {filtered.map((item, index) => {
            const slug = itemSlug(item, index);
            return (
              <Pressable
                key={slug}
                style={({ pressed }) => [
                  styles.card,
                  cardWidth != null ? { width: cardWidth } : { width: '100%' },
                  pressed && { opacity: 0.92 },
                ]}
                onPress={() =>
                  router.push(`${detailBase}/${slug}` as Href)
                }
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={[
                      styles.cardImage,
                      { height: responsive.isPhone ? 140 : 160 },
                    ]}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.cardBody}>
                  {item.tag || item.meta ? (
                    <Text style={styles.meta}>
                      {[item.tag, item.meta].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.body} numberOfLines={3}>
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={styles.viewLink}>View & read →</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {!filtered.length ? (
          <View style={styles.empty}>
            <Text style={styles.cardTitle}>No matches</Text>
            <Text style={styles.body}>Try another search or clear filters.</Text>
            <Pressable
              onPress={() => {
                setQuery('');
                setTag('all');
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>Clear filters</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export function CmsListDetailScreen({
  headerTitle,
  item,
  fallbackTitle,
}: {
  headerTitle: string;
  item?: CmsListItem | null;
  fallbackTitle: string;
}) {
  if (item === undefined) {
    return (
      <Screen headerTitle={headerTitle} headerSubtitle="Loading">
        <Text style={styles.body}>Loading…</Text>
      </Screen>
    );
  }

  if (item === null) {
    return (
      <Screen headerTitle={headerTitle} headerSubtitle="Not found">
        <Text style={styles.cardTitle}>{fallbackTitle}</Text>
        <Text style={styles.body}>This item is unavailable.</Text>
      </Screen>
    );
  }

  const paragraphs = (item.content || item.description || '')
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Screen
      headerTitle={headerTitle}
      headerSubtitle={item.tag || item.meta || 'Details'}
      scroll={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.detailImage} />
        ) : null}
        <Text style={styles.detailTitle}>{item.title}</Text>
        {item.meta ? <Text style={styles.meta}>{item.meta}</Text> : null}
        {paragraphs.map((p) => (
          <Text key={p.slice(0, 32)} style={styles.body}>
            {p}
          </Text>
        ))}
        {item.points?.length ? (
          <View style={styles.points}>
            {item.points.map((point) => (
              <View key={point} style={styles.point}>
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

/** re-export for callers that pass CmsListBody */
export type { CmsListBody };

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scroll: {
    paddingBottom: SCREEN_SCROLL_BOTTOM,
    gap: Spacing.three,
    flexGrow: 1,
  },
  hero: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Brand.primary,
  },
  heroImage: { width: '100%', height: 160 },
  heroText: {
    padding: Spacing.four,
    backgroundColor: 'rgba(11,61,145,0.92)',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stat: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.three,
  },
  statValue: {
    color: Brand.primary,
    fontFamily: Fonts.bold,
    fontSize: 20,
  },
  statLabel: {
    marginTop: 2,
    color: Brand.muted,
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: Brand.dark,
    fontFamily: Fonts.regular,
    fontSize: 14,
    padding: 0,
  },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    borderRadius: 999,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  chipText: {
    color: Brand.dark,
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },
  chipTextActive: { color: Brand.white },
  listCount: {
    color: Brand.primary,
    fontFamily: Fonts.semibold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: Spacing.three, gap: 4 },
  meta: {
    color: Brand.primary,
    fontFamily: Fonts.semibold,
    fontSize: 11,
  },
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
  viewLink: {
    marginTop: 6,
    color: Brand.primary,
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
  empty: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.four,
    gap: 6,
  },
  clearBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Brand.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    color: Brand.white,
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
  },
  detailTitle: {
    color: Brand.dark,
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  points: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  point: {
    backgroundColor: '#E8F1FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointText: {
    color: Brand.dark,
    fontFamily: Fonts.semibold,
    fontSize: 12,
  },
});

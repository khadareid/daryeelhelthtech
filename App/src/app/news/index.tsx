import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/screen';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { getNewsFeedRequest, type NewsFeedItem } from '@/lib/api';

export default function NewsListScreen() {
  const theme = useTheme();
  const { accessToken } = useAuth();
  const [live, setLive] = useState<NewsFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLive(await getNewsFeedRequest({ token: accessToken }));
    } catch {
      setLive([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen headerTitle="Health news" onRefresh={load}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Text style={[styles.heroTitle, { color: theme.brandDark }]}>
          Health news feed
        </Text>
        <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
          Live posts from Daryeel. Do not share private medical details publicly.
        </Text>
        <Pressable
          onPress={() => router.push('/apply-professional' as Href)}
          style={[styles.applyBtn, { backgroundColor: theme.primary }]}>
          <Text style={styles.applyText}>Apply as professional</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={theme.primary} />
      ) : null}

      <View style={styles.list}>
        {live.map((news) => (
          <Pressable
            key={news.newspostid}
            onPress={() => router.push(`/news/${news.newspostid}` as Href)}
            style={[
              styles.card,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.body}>
              <Text style={[styles.cat, { color: theme.primary }]}>
                {news.category.replace(/_/g, ' ')}
                {news.author?.verifiedProfessional ? ' · Verified' : ''}
              </Text>
              <Text
                style={[styles.title, { color: theme.brandDark }]}
                numberOfLines={2}>
                {news.title}
              </Text>
              <Text
                style={[styles.summary, { color: theme.textSecondary }]}
                numberOfLines={3}>
                {news.content}
              </Text>
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {(news.reactionCount ?? 0) + ' likes · '}
                {(news.commentCount ?? 0) + ' comments'}
              </Text>
            </View>
          </Pressable>
        ))}

        {live.length === 0 && !loading ? (
          <Text style={[styles.summary, { color: theme.textSecondary }]}>
            No published news yet. Check back after Super Admin seeds the feed.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  heroSub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  applyBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  applyText: {
    color: '#fff',
    fontFamily: Fonts.semibold,
    fontSize: 13,
  },
  list: {
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  body: {
    padding: Spacing.three,
    gap: 6,
  },
  cat: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
  },
  summary: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  date: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
});

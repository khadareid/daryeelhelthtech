import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { getNewsPostRequest } from '@/lib/api';

type NewsPost = {
  newspostid: string;
  title: string;
  content: string;
  category?: string;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
  author?: { fullName?: string };
};

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [news, setNews] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) {
        setMissing(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getNewsPostRequest(id, accessToken);
        const row = (res?.result ?? res?.data ?? null) as NewsPost | null;
        if (!alive) return;
        if (!row) setMissing(true);
        else setNews(row);
      } catch {
        if (alive) setMissing(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, accessToken]);

  if (loading) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (missing || !news) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        <Text style={[styles.missingTitle, { color: theme.brandDark }]}>
          Article not found
        </Text>
        <Pressable onPress={() => router.replace('/news' as Href)}>
          <Text style={{ color: theme.primary, fontFamily: Fonts.semibold }}>
            Back to news
          </Text>
        </Pressable>
      </View>
    );
  }

  const paragraphs = String(news.content || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}>
      {news.coverImageUrl ? (
        <Image
          source={news.coverImageUrl}
          style={styles.hero}
          contentFit="cover"
        />
      ) : null}
      <View style={styles.body}>
        <Text style={[styles.cat, { color: theme.primary }]}>
          {String(news.category || '').replace(/_/g, ' ')}
        </Text>
        <Text style={[styles.title, { color: theme.brandDark }]}>
          {news.title}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {news.author?.fullName ? `${news.author.fullName} · ` : ''}
          {news.publishedAt
            ? new Date(news.publishedAt).toLocaleDateString()
            : ''}
        </Text>

        <View style={styles.divider} />

        {paragraphs.map((paragraph, index) => (
          <Text
            key={index}
            style={[styles.paragraph, { color: theme.text }]}>
            {paragraph}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  missingTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 18,
  },
  hero: {
    width: '100%',
    height: 240,
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cat: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 34,
  },
  date: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.35)',
    marginVertical: Spacing.two,
  },
  paragraph: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Spacing.two,
  },
});
